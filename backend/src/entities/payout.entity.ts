import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Transaction } from './transaction.entity';
import { User } from './user.entity';

export type PayoutStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

/** Seller payout for a completed escrow.
 *  One row per transaction. Money moves via Paystack Transfers to the
 *  seller's saved recipient. PENDING = retryable (no recipient yet,
 *  low balance, provider error). */
@Entity('payouts')
export class Payout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  transactionId: string;

  @ManyToOne(() => Transaction, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transactionId' })
  transaction: Transaction;

  @Column({ type: 'uuid' })
  sellerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  /** Gross amount in kobo — full escrow value (no platform fee in v1). */
  @Column({ type: 'bigint' })
  amountKobo: string;

  @Column({ type: 'varchar', length: 64 })
  recipientCode: string;

  /** Our idempotency key: PO-{txCode}-{timestamp}. */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 80 })
  reference: string;

  /** Paystack transfer code once accepted by the provider. */
  @Column({ type: 'varchar', length: 64, nullable: true })
  transferCode: string | null;

  @Column({ type: 'varchar', length: 16, default: 'PENDING' })
  status: PayoutStatus;

  @Column({ type: 'text', nullable: true })
  failureReason: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
