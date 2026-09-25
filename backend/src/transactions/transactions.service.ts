import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import {
  Transaction,
  type TransactionStatus,
} from '../entities/transaction.entity';
import {
  TransactionEvent,
  type TransactionEventType,
} from '../entities/transaction-event.entity';
import { TransactionMessage } from '../entities/transaction-message.entity';
import { Listing } from '../entities/listing.entity';
import { PayoutsService } from '../payouts/payouts.service';
import { isDev } from '../auth/auth.utils';

const TERMINAL: TransactionStatus[] = ['COMPLETED', 'CANCELLED', 'REFUNDED'];

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction) private txs: Repository<Transaction>,
    @InjectRepository(TransactionEvent) private events: Repository<TransactionEvent>,
    @InjectRepository(TransactionMessage) private messages: Repository<TransactionMessage>,
    @InjectRepository(Listing) private listings: Repository<Listing>,
    private payouts: PayoutsService,
  ) {}

  // ---------- lifecycle ----------

  async create(buyerId: string, listingId: string) {
    const listing = await this.listings.findOne({
      where: { id: listingId },
      relations: ['seller'],
    });
    if (!listing || listing.status !== 'ACTIVE') {
      throw new NotFoundException('Listing is not available.');
    }
    if (listing.sellerId === buyerId) {
      throw new BadRequestException('You cannot buy your own listing.');
    }
    const tx = await this.txs.save(
      this.txs.create({
        code: await this.uniqueCode(),
        listingId: listing.id,
        listingTitle: listing.title,
        amountKobo: listing.priceKobo,
        buyerId,
        sellerId: listing.sellerId,
        status: 'AGREEMENT',
      }),
    );
    await this.event(tx.id, 'AGREEMENT_CREATED', buyerId, 'Agreement created — awaiting payment.');
    return this.detailFor(tx.id, buyerId);
  }

  async mine(userId: string, side: string) {
    const qb = this.txs
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.buyer', 'buyer')
      .leftJoinAndSelect('t.seller', 'seller')
      .orderBy('t.createdAt', 'DESC');
    if (side === 'buying') qb.where('t.buyerId = :userId', { userId });
    else if (side === 'selling') qb.where('t.sellerId = :userId', { userId });
    else qb.where('t.buyerId = :userId OR t.sellerId = :userId', { userId });
    const items = await qb.getMany();
    return items.map((t) => this.safe(t));
  }

  async detailFor(id: string, userId: string) {
    const tx = await this.load(id);
    this.assertParticipant(tx, userId);
    return this.detailOf(tx);
  }

  /** Same as detailFor but without the participant check (admin use). */
  async detailUnsafe(id: string) {
    const tx = await this.load(id);
    return this.detailOf(tx);
  }

  private async detailOf(tx: Transaction) {
    const events = await this.events.find({
      where: { transactionId: tx.id },
      order: { createdAt: 'ASC' },
    });
    return { ...this.safe(tx), events };
  }

  /** Buyer funds escrow. Paystack when keys exist, test-mode in dev, else 501.
   *  Works WITHOUT a webhook URL in the Paystack dashboard — the redirect
   *  back to /transactions/:id?reference=... plus verify-payment is the
   *  primary path. The stored paymentReference allows retry if the tab closes. */
  async fund(id: string, buyerId: string) {
    const tx = await this.load(id);
    this.assertParticipant(tx, buyerId);
    if (tx.buyerId !== buyerId)
      throw new ForbiddenException('Only the buyer can fund this transaction.');
    this.assertStatus(tx, ['AGREEMENT']);

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (secret) {
      const reference = `${tx.code}-${Date.now()}`;
      const res = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: tx.buyer.email,
          amount: tx.amountKobo,
          reference,
          callback_url:
            process.env.PAYSTACK_CALLBACK_URL ??
            `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/transactions/${tx.id}`,
          metadata: { transactionId: tx.id, code: tx.code },
        }),
      });
      const data = (await res.json()) as {
        status?: boolean;
        message?: string;
        data?: { authorization_url?: string; reference?: string };
      };
      if (!res.ok || !data.status || !data.data?.authorization_url) {
        throw new BadRequestException(
          `Payment provider error: ${data.message ?? 'initialization failed'}.`,
        );
      }
      // Persist the reference BEFORE redirect so a closed tab can still verify.
      tx.paymentReference = data.data.reference ?? reference;
      await this.txs.save(tx);
      return {
        provider: 'paystack' as const,
        authorizationUrl: data.data.authorization_url,
        reference: tx.paymentReference,
      };
    }

    if (isDev()) {
      tx.status = 'SECURED';
      tx.fundedVia = 'test';
      await this.txs.save(tx);
      await this.event(tx.id, 'PAYMENT_SECURED', buyerId, 'Payment secured (TEST MODE — no real money moved).');
      return { provider: 'test' as const, testMode: true };
    }

    throw new HttpException(
      {
        ok: false,
        code: 'PAYMENT_NOT_CONFIGURED',
        message:
          'Live payments need PAYSTACK_SECRET_KEY. Set it on the backend to enable funding.',
      },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  /** After Paystack redirect — confirm by reference and secure funds.
   *  Hardened: amount + metadata + reference are all cross-checked so one
   *  buyer's receipt can't secure another transaction and prices can't be
   *  tampered with. Idempotent — already-secured returns current state. */
  async verifyPayment(id: string, userId: string, reference: string) {
    const tx = await this.load(id);
    this.assertParticipant(tx, userId);
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new BadRequestException('Payment provider not configured.');
    if (tx.status !== 'AGREEMENT') return this.detailFor(id, userId);
    const ref = (reference ?? '').trim();
    if (!ref) throw new BadRequestException('Payment reference is required.');
    // If we stored a reference at initialize time, the verify reference must match it.
    if (tx.paymentReference && ref !== tx.paymentReference) {
      throw new BadRequestException('Payment reference does not match this transaction.');
    }
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const data = (await res.json()) as {
      status?: boolean;
      message?: string;
      data?: {
        status?: string;
        reference?: string;
        amount?: number;
        currency?: string;
        paid_at?: string;
        metadata?: { transactionId?: string; code?: string };
      };
    };
    if (!res.ok || !data.status || data.data?.status !== 'success') {
      throw new BadRequestException('Payment not confirmed by provider yet.');
    }
    const paid = data.data!;
    if (String(paid.amount) !== String(tx.amountKobo)) {
      throw new BadRequestException('Paid amount does not match this transaction.');
    }
    if (paid.metadata?.transactionId && paid.metadata.transactionId !== tx.id) {
      throw new BadRequestException('Payment belongs to a different transaction.');
    }
    if (paid.reference && tx.paymentReference && paid.reference !== tx.paymentReference) {
      throw new BadRequestException('Payment reference mismatch.');
    }
    tx.status = 'SECURED';
    tx.fundedVia = 'paystack';
    tx.paymentReference = paid.reference ?? ref;
    tx.paidAt = paid.paid_at ? new Date(paid.paid_at) : new Date();
    await this.txs.save(tx);
    await this.event(tx.id, 'PAYMENT_SECURED', userId, 'Payment secured via Paystack.');
    return this.detailFor(id, userId);
  }

  /** Paystack webhook — marks SECURED on charge.success.
   *  Optional: works fine without a webhook URL set in the dashboard
   *  (verify-payment is primary). When enabled, signature is timing-safe
   *  checked and amount/metadata are validated before crediting. */
  async paystackWebhook(rawBody: string, signature: string | undefined) {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new BadRequestException('Payment provider not configured.');
    const expected = createHmac('sha512', secret).update(rawBody).digest('hex');
    if (!signature || !this.safeEqualHex(signature, expected)) {
      throw new ForbiddenException('Invalid webhook signature.');
    }
    const payload = JSON.parse(rawBody) as {
      event?: string;
      data?: {
        reference?: string;
        amount?: number;
        metadata?: { transactionId?: string; code?: string };
        paid_at?: string;
      };
    };
    if (payload.event !== 'charge.success') return { ok: true, ignored: true };
    const txId = payload.data?.metadata?.transactionId;
    if (!txId) return { ok: true, ignored: true };
    const tx = await this.load(txId);
    if (tx.status !== 'AGREEMENT') return { ok: true, ignored: true };
    if (payload.data?.amount !== undefined && String(payload.data.amount) !== String(tx.amountKobo)) {
      // Amount mismatch — do not credit; log for manual review.
      await this.event(tx.id, 'DISPUTED', null, 'Webhook amount mismatch — held for review.');
      return { ok: true, ignored: true, reason: 'amount-mismatch' };
    }
    if (payload.data?.reference) tx.paymentReference = payload.data.reference;
    tx.status = 'SECURED';
    tx.fundedVia = 'paystack';
    tx.paidAt = payload.data?.paid_at ? new Date(payload.data.paid_at) : new Date();
    await this.txs.save(tx);
    await this.event(tx.id, 'PAYMENT_SECURED', null, 'Payment secured via Paystack (webhook).');
    return { ok: true };
  }

  async deliver(id: string, sellerId: string, note: string, deliveryUrl?: string) {
    const tx = await this.load(id);
    this.assertParticipant(tx, sellerId);
    if (tx.sellerId !== sellerId)
      throw new ForbiddenException('Only the seller can deliver.');
    this.assertStatus(tx, ['SECURED']);
    tx.status = 'DELIVERED';
    tx.deliveryNote = note;
    tx.deliveryUrl = deliveryUrl ?? null;
    await this.txs.save(tx);
    await this.event(tx.id, 'DELIVERY_SUBMITTED', sellerId, `Delivery submitted${deliveryUrl ? ' with link' : ''}.`);
    return this.detailFor(id, sellerId);
  }

  async accept(id: string, buyerId: string) {
    const tx = await this.load(id);
    this.assertParticipant(tx, buyerId);
    if (tx.buyerId !== buyerId)
      throw new ForbiddenException('Only the buyer can accept delivery.');
    this.assertStatus(tx, ['DELIVERED']);
    tx.status = 'COMPLETED';
    await this.txs.save(tx);
    await this.listings.increment({ id: tx.listingId }, 'salesCount', 1);
    await this.event(tx.id, 'COMPLETED', buyerId, 'Buyer accepted delivery — transaction complete.');
    // Release money to the seller. Never fails the accept itself —
    // payout problems land as retryable PENDING/FAILED rows.
    await this.payouts.triggerForTransaction(tx.id);
    return this.detailFor(id, buyerId);
  }

  async dispute(id: string, userId: string, reason: string) {
    const tx = await this.load(id);
    this.assertParticipant(tx, userId);
    this.assertStatus(tx, ['AGREEMENT', 'SECURED', 'DELIVERED']);
    tx.status = 'DISPUTED';
    tx.disputeReason = reason;
    await this.txs.save(tx);
    await this.event(tx.id, 'DISPUTED', userId, `Dispute opened: ${reason}`);
    return this.detailFor(id, userId);
  }

  async cancel(id: string, userId: string) {
    const tx = await this.load(id);
    this.assertParticipant(tx, userId);
    this.assertStatus(tx, ['AGREEMENT']);
    tx.status = 'CANCELLED';
    await this.txs.save(tx);
    await this.event(tx.id, 'CANCELLED', userId, 'Agreement cancelled before funding.');
    return this.detailFor(id, userId);
  }

  // ---------- admin dispute resolution ----------

  async listDisputed() {
    const items = await this.txs.find({
      where: { status: 'DISPUTED' },
      relations: ['buyer', 'seller'],
      order: { createdAt: 'DESC' },
    });
    return items.map((t) => this.safe(t));
  }

  /** Admin closes a dispute. release → COMPLETED + payout.
   *  refund → money back to buyer (Paystack refund API when live-funded,
   *  direct mark when test-funded since nothing real moved). */
  async resolveDispute(
    id: string,
    adminId: string,
    decision: 'release' | 'refund',
    note: string,
  ) {
    const tx = await this.load(id);
    this.assertStatus(tx, ['DISPUTED']);
    if (decision === 'release') {
      tx.status = 'COMPLETED';
      await this.txs.save(tx);
      await this.listings.increment({ id: tx.listingId }, 'salesCount', 1);
      await this.event(tx.id, 'RESOLVED', adminId, `Dispute resolved — released to seller. ${note}`);
      await this.payouts.triggerForTransaction(tx.id);
      return this.detailUnsafe(id);
    }
    // refund
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (secret && tx.fundedVia === 'paystack' && tx.paymentReference) {
      const res = await fetch('https://api.paystack.co/refund', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transaction: tx.paymentReference }),
      });
      const data = (await res.json()) as { status?: boolean; message?: string };
      if (!res.ok || !data.status) {
        throw new BadRequestException(
          `Refund failed at provider: ${data.message ?? 'unknown error'}. No state changed — retry.`,
        );
      }
    }
    tx.status = 'REFUNDED';
    await this.txs.save(tx);
    await this.event(tx.id, 'REFUNDED', adminId, `Dispute resolved — refunded to buyer. ${note}`);
    return this.detailUnsafe(id);
  }

  // ---------- in-escrow chat ----------

  /** Chat thread — participants only. Allowed in every state so disputes
   *  keep full context. Plain text, capped at 2000 chars. */
  async listMessages(id: string, userId: string) {
    const tx = await this.load(id);
    this.assertParticipant(tx, userId);
    const rows = await this.messages.find({
      where: { transactionId: id },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
      take: 200,
    });
    return rows.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt,
      senderId: m.senderId,
      senderName: (m.sender as unknown as { name?: string })?.name ?? 'Member',
      mine: m.senderId === userId,
    }));
  }

  async postMessage(id: string, userId: string, body: string) {
    const tx = await this.load(id);
    this.assertParticipant(tx, userId);
    const text = (body ?? '').trim().replace(/\s+/g, ' ');
    if (!text) throw new BadRequestException('Message is empty.');
    if (text.length > 2000) throw new BadRequestException('Message too long (max 2000).');
    const saved = await this.messages.save(
      this.messages.create({ transactionId: id, senderId: userId, body: text }),
    );
    return {
      id: saved.id,
      body: saved.body,
      createdAt: saved.createdAt,
      senderId: userId,
      mine: true,
    };
  }

  // ---------- helpers ----------

  private async load(id: string) {
    const tx = await this.txs.findOne({
      where: { id },
      relations: ['buyer', 'seller'],
    });
    if (!tx) throw new NotFoundException('Transaction not found.');
    return tx;
  }

  private assertParticipant(tx: Transaction, userId: string) {
    if (tx.buyerId !== userId && tx.sellerId !== userId) {
      throw new ForbiddenException('You are not part of this transaction.');
    }
  }

  private assertStatus(tx: Transaction, allowed: TransactionStatus[]) {
    if (TERMINAL.includes(tx.status) || !allowed.includes(tx.status)) {
      throw new BadRequestException(
        `Action not allowed while transaction is ${tx.status}.`,
      );
    }
  }

  /** Timing-safe hex compare for webhook signatures. */
  private safeEqualHex(a: string, b: string): boolean {
    try {
      const ba = Buffer.from(a, 'hex');
      const bb = Buffer.from(b, 'hex');
      return ba.length === bb.length && timingSafeEqual(ba, bb);
    } catch {
      return false;
    }
  }

  private async uniqueCode(): Promise<string> {
    for (let i = 0; i < 10; i++) {
      const code = `TX-${randomInt(10000, 100000)}`;
      const exists = await this.txs.findOne({ where: { code } });
      if (!exists) return code;
    }
    return `TX-${Date.now().toString().slice(-5)}`;
  }

  private async event(
    transactionId: string,
    type: TransactionEventType,
    actorId: string | null,
    message: string,
  ) {
    await this.events.save(
      this.events.create({ transactionId, type, actorId, message }),
    );
  }

  private safe(tx: Transaction) {
    const strip = (u: unknown) => {
      if (!u || typeof u !== 'object') return u;
      const { passwordHash: _omit, ...rest } = u as Record<string, unknown>;
      void _omit;
      return rest;
    };
    return { ...tx, buyer: strip(tx.buyer), seller: strip(tx.seller) };
  }
}
