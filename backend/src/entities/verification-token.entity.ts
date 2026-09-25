import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('verification_tokens')
export class VerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Lower-cased email the token was issued for. */
  @Index()
  @Column({ type: 'varchar', length: 254 })
  identifier: string;

  /** SHA-256 hex of the raw token sent to the user. */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 128, select: false })
  tokenHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
