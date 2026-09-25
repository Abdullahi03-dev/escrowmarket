import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac, timingSafeEqual } from 'crypto';
import { Payout, type PayoutStatus } from '../entities/payout.entity';
import { Transaction } from '../entities/transaction.entity';
import { User } from '../entities/user.entity';

const PAYSTACK = 'https://api.paystack.co';

type BankRow = { name: string; code: string; slug?: string };

function secretOrThrow(): string {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new BadRequestException('Payment provider not configured.');
  return secret;
}

@Injectable()
export class PayoutsService {
  private bankCache: { at: number; rows: BankRow[] } | null = null;

  constructor(
    @InjectRepository(Payout) private payouts: Repository<Payout>,
    @InjectRepository(Transaction) private txs: Repository<Transaction>,
    @InjectRepository(User) private users: Repository<User>,
  ) {}

  private authed(secret: string) {
    return { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' };
  }

  // ---------- banks ----------

  /** Nigerian bank list for the recipient form. Cached 24h in memory. */
  async banks(): Promise<BankRow[]> {
    if (this.bankCache && Date.now() - this.bankCache.at < 24 * 3600 * 1000) {
      return this.bankCache.rows;
    }
    const secret = secretOrThrow();
    const res = await fetch(`${PAYSTACK}/bank?country=nigeria&perPage=100`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const data = (await res.json()) as { status?: boolean; data?: BankRow[] };
    if (!res.ok || !data.status || !Array.isArray(data.data)) {
      if (this.bankCache) return this.bankCache.rows;
      throw new BadRequestException('Could not load bank list. Try again.');
    }
    const rows = data.data
      .map((b) => ({ name: b.name, code: b.code }))
      .sort((a, b) => a.name.localeCompare(b.name));
    this.bankCache = { at: Date.now(), rows };
    return rows;
  }

  /** Confirm the account name before the seller saves details. */
  async resolveAccount(accountNumber: string, bankCode: string) {
    const secret = secretOrThrow();
    const url = `${PAYSTACK}/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${secret}` } });
    const data = (await res.json()) as {
      status?: boolean;
      message?: string;
      data?: { account_name?: string; account_number?: string };
    };
    if (!res.ok || !data.status || !data.data?.account_name) {
      throw new BadRequestException(data.message ?? 'Account could not be verified.');
    }
    return { accountName: data.data.account_name, accountNumber: data.data.account_number };
  }

  /** Verify + create a Paystack recipient, store code + display info on the user.
   *  Full account number is never persisted in our DB. */
  async saveRecipient(userId: string, accountNumber: string, bankCode: string) {
    const secret = secretOrThrow();
    const resolved = await this.resolveAccount(accountNumber, bankCode);
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    const banks = await this.banks().catch(() => [] as BankRow[]);
    const bankName = banks.find((b) => b.code === bankCode)?.name ?? bankCode;

    const res = await fetch(`${PAYSTACK}/transferrecipient`, {
      method: 'POST',
      headers: this.authed(secret),
      body: JSON.stringify({
        type: 'nuban',
        name: resolved.accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN',
      }),
    });
    const data = (await res.json()) as {
      status?: boolean;
      message?: string;
      data?: { recipient_code?: string };
    };
    if (!res.ok || !data.status || !data.data?.recipient_code) {
      throw new BadRequestException(`Recipient error: ${data.message ?? 'could not save bank account'}.`);
    }
    user.payoutRecipientCode = data.data.recipient_code;
    user.payoutBankName = bankName;
    user.payoutAccountName = resolved.accountName;
    user.payoutLast4 = accountNumber.slice(-4);
    await this.users.save(user);
    return {
      bankName,
      accountName: resolved.accountName,
      last4: accountNumber.slice(-4),
    };
  }

  async myRecipient(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user?.payoutRecipientCode) return { saved: false as const };
    return {
      saved: true as const,
      bankName: user.payoutBankName,
      accountName: user.payoutAccountName,
      last4: user.payoutLast4,
    };
  }

  // ---------- payouts ----------

  /** Called after a transaction completes (accept or admin release).
   *  Never throws — failures land as retryable PENDING/FAILED rows. */
  async triggerForTransaction(txId: string): Promise<Payout | null> {
    try {
      const tx = await this.txs.findOne({ where: { id: txId }, relations: ['seller'] });
      if (!tx || tx.status !== 'COMPLETED') return null;
      const existing = await this.payouts.findOne({ where: { transactionId: txId } });
      if (existing) {
        if (existing.status === 'SUCCESS') return existing;
        return this.attempt(existing);
      }
      const secret = process.env.PAYSTACK_SECRET_KEY;
      if (!secret) return null; // test-mode funding — nothing real to send.
      if (tx.fundedVia !== 'paystack') return null;
      const seller = tx.seller;
      if (!seller?.payoutRecipientCode) {
        return this.payouts.save(
          this.payouts.create({
            transactionId: txId,
            sellerId: tx.sellerId,
            amountKobo: tx.amountKobo,
            recipientCode: 'PENDING_RECIPIENT',
            reference: `PO-${tx.code}-${Date.now()}`,
            status: 'PENDING',
            failureReason: 'Seller has not added bank details yet.',
          }),
        );
      }
      const row = await this.payouts.save(
        this.payouts.create({
          transactionId: txId,
          sellerId: tx.sellerId,
          amountKobo: tx.amountKobo,
          recipientCode: seller.payoutRecipientCode,
          reference: `PO-${tx.code}-${Date.now()}`,
          status: 'PENDING',
        }),
      );
      return this.attempt(row);
    } catch {
      return null;
    }
  }

  /** Retry a stuck payout (seller action). */
  async retry(payoutId: string, sellerId: string) {
    const row = await this.payouts.findOne({ where: { id: payoutId } });
    if (!row || row.sellerId !== sellerId) throw new NotFoundException('Payout not found.');
    if (row.status === 'SUCCESS') return this.present(row, true);
    // Refresh recipient in case the seller just added bank details.
    const seller = await this.users.findOne({ where: { id: sellerId } });
    if (row.recipientCode === 'PENDING_RECIPIENT' && seller?.payoutRecipientCode) {
      row.recipientCode = seller.payoutRecipientCode;
      row.failureReason = null;
      await this.payouts.save(row);
    }
    const updated = await this.attempt(row);
    return this.present(updated, true);
  }

  /** Re-check a payout against Paystack (either side of the deal). */
  async refresh(payoutId: string, userId: string) {
    const row = await this.payouts.findOne({ where: { id: payoutId }, relations: ['transaction'] });
    if (!row) throw new NotFoundException('Payout not found.');
    const tx = row.transaction;
    if (tx.buyerId !== userId && tx.sellerId !== userId) {
      throw new ForbiddenException('You are not part of this transaction.');
    }
    if (row.status === 'SUCCESS' || !row.transferCode) return this.present(row, row.sellerId === userId);
    const secret = secretOrThrow();
    const res = await fetch(`${PAYSTACK}/transfer/${encodeURIComponent(row.transferCode)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const data = (await res.json()) as { status?: boolean; data?: { status?: string } };
    if (res.ok && data.status) {
      const s = data.data?.status;
      row.status = s === 'success' ? 'SUCCESS' : s === 'failed' ? 'FAILED' : 'PENDING';
      if (s === 'failed') row.failureReason = 'Transfer failed at the provider.';
      await this.payouts.save(row);
    }
    return this.present(row, row.sellerId === userId);
  }

  async mine(sellerId: string) {
    const rows = await this.payouts.find({
      where: { sellerId },
      relations: ['transaction'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return rows.map((r) => this.present(r, true));
  }

  /** Payout for a transaction — seller sees bank detail, buyer sees status only. */
  async forTransaction(txId: string, userId: string) {
    const tx = await this.txs.findOne({ where: { id: txId } });
    if (!tx) throw new NotFoundException('Transaction not found.');
    if (tx.buyerId !== userId && tx.sellerId !== userId) {
      throw new ForbiddenException('You are not part of this transaction.');
    }
    const row = await this.payouts.findOne({ where: { transactionId: txId } });
    if (!row) return null;
    return this.present(row, tx.sellerId === userId);
  }

  /** Paystack transfer webhook — transfer.success / transfer.failed.
   *  Optional like the charge webhook; signature-checked the same way. */
  async transferWebhook(rawBody: string, signature: string | undefined) {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new BadRequestException('Payment provider not configured.');
    const expected = createHmac('sha512', secret).update(rawBody).digest('hex');
    if (!signature || !this.safeEqualHex(signature, expected)) {
      throw new ForbiddenException('Invalid webhook signature.');
    }
    const payload = JSON.parse(rawBody) as {
      event?: string;
      data?: { reference?: string; status?: string; transfer_code?: string };
    };
    if (payload.event !== 'transfer.success' && payload.event !== 'transfer.failed') {
      return { ok: true, ignored: true };
    }
    const ref = payload.data?.reference;
    if (!ref) return { ok: true, ignored: true };
    const row = await this.payouts.findOne({ where: { reference: ref } });
    if (!row || row.status === 'SUCCESS') return { ok: true, ignored: true };
    row.status = payload.event === 'transfer.success' ? 'SUCCESS' : 'FAILED';
    if (payload.data?.transfer_code) row.transferCode = payload.data.transfer_code;
    if (row.status === 'FAILED') row.failureReason = 'Transfer failed at the provider.';
    await this.payouts.save(row);
    return { ok: true };
  }

  // ---------- internals ----------

  private async attempt(row: Payout): Promise<Payout> {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return row;
    if (row.recipientCode === 'PENDING_RECIPIENT') {
      row.status = 'PENDING';
      row.failureReason = 'Seller has not added bank details yet.';
      return this.payouts.save(row);
    }
    try {
      const res = await fetch(`${PAYSTACK}/transfer`, {
        method: 'POST',
        headers: this.authed(secret),
        body: JSON.stringify({
          source: 'balance',
          amount: Number(row.amountKobo),
          recipient: row.recipientCode,
          reference: row.reference,
          reason: `SecureMarket escrow payout ${row.reference}`,
        }),
      });
      const data = (await res.json()) as {
        status?: boolean;
        message?: string;
        data?: { transfer_code?: string; status?: string };
      };
      if (!res.ok || !data.status || !data.data?.transfer_code) {
        row.status = 'FAILED';
        row.failureReason = data.message ?? 'Transfer rejected by provider.';
        return this.payouts.save(row);
      }
      row.transferCode = data.data.transfer_code;
      row.status = data.data.status === 'success' ? 'SUCCESS' : 'PENDING';
      row.failureReason = null;
      return this.payouts.save(row);
    } catch (err) {
      row.status = 'FAILED';
      row.failureReason = err instanceof Error ? err.message : 'Transfer error.';
      return this.payouts.save(row);
    }
  }

  private present(row: Payout, isSeller: boolean) {
    const tx = (row as { transaction?: Transaction }).transaction as
      | { code?: string; listingTitle?: string }
      | undefined;
    const base = {
      id: row.id,
      transactionId: row.transactionId,
      code: tx?.code,
      listingTitle: tx?.listingTitle,
      amountKobo: row.amountKobo,
      reference: row.reference,
      status: row.status as PayoutStatus,
      failureReason: row.failureReason,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    if (!isSeller) return base;
    const seller = (row as { seller?: User }).seller as
      | { payoutBankName?: string | null; payoutLast4?: string | null }
      | undefined;
    return {
      ...base,
      bankName: seller?.payoutBankName ?? undefined,
      last4: seller?.payoutLast4 ?? undefined,
    };
  }

  private safeEqualHex(a: string, b: string): boolean {
    try {
      const ba = Buffer.from(a, 'hex');
      const bb = Buffer.from(b, 'hex');
      return ba.length === bb.length && timingSafeEqual(ba, bb);
    } catch {
      return false;
    }
  }
}
