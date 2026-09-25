import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Listing } from './listing.entity';
import { TransactionEvent } from './transaction-event.entity';

export type TransactionStatus =
  | 'AGREEMENT'
  | 'SECURED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED'
  | 'REFUNDED';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Human code, e.g. TX-83921. Unique, generated at creation. */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 16 })
  code: string;

  @Column({ type: 'uuid' })
  listingId: string;

  @ManyToOne(() => Listing, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'listingId' })
  listing: Listing | null;

  /** Snapshot at purchase time — listing edits must not rewrite history. */
  @Column({ type: 'varchar', length: 140 })
  listingTitle: string;

  @Column({ type: 'bigint' })
  amountKobo: string;

  @Column({ type: 'uuid' })
  buyerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buyerId' })
  buyer: User;

  @Column({ type: 'uuid' })
  sellerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @Column({ type: 'varchar', length: 16, default: 'AGREEMENT' })
  status: TransactionStatus;

  /** 'paystack' | 'test' | null — how funds were secured. */
  @Column({ type: 'varchar', length: 16, nullable: true })
  fundedVia: string | null;

  /** Paystack reference from initialize — stored so funding can be retried
   *  if the buyer closes the tab before the redirect back. */
  @Column({ type: 'varchar', length: 80, nullable: true })
  paymentReference: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'text', nullable: true })
  deliveryNote: string | null;

  @Column({ type: 'varchar', nullable: true })
  deliveryUrl: string | null;

  @Column({ type: 'text', nullable: true })
  disputeReason: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => TransactionEvent, (e) => e.transaction)
  events: TransactionEvent[];
}
