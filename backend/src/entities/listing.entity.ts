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
import { User } from './user.entity';

export type ListingKind = 'PRODUCT' | 'SERVICE';
export type ListingStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

export const LISTING_CATEGORIES = [
  'Software',
  'Template',
  'Course',
  'Audio',
  'Design Asset',
  'Ebook',
  'Service',
  'Other',
] as const;

@Entity('listings')
@Index(['status', 'createdAt'])
export class Listing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  sellerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @Column({ type: 'varchar', length: 140 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  /** Price in kobo (minor units) — never floats for money. */
  @Column({ type: 'bigint' })
  priceKobo: string;

  @Column({ type: 'varchar', length: 8, default: 'NGN' })
  currency: string;

  @Column({ type: 'varchar', length: 16 })
  kind: ListingKind;

  @Column({ type: 'varchar', length: 32 })
  category: string;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string | null;

  @Column({ type: 'varchar', length: 16, default: 'ACTIVE' })
  status: ListingStatus;

  @Column({ type: 'int', default: 0 })
  salesCount: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
