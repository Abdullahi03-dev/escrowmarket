import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from './account.entity';
import { Session } from './session.entity';
import { PasswordResetToken } from './password-reset-token.entity';

export type UserRole = 'BUYER' | 'SELLER' | 'BOTH' | 'ADMIN';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Always stored lower-cased (see DTOs/service), so a plain unique index
  // enforces case-insensitive uniqueness with no DB extensions (Neon-safe).
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 254, nullable: true })
  email: string | null;

  // Null for OAuth-only accounts until a password is set.
  @Column({ type: 'varchar', nullable: true, select: false })
  passwordHash: string | null;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 30 })
  username: string;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'varchar', length: 280, nullable: true })
  bio: string | null;

  @Column({ type: 'varchar', length: 16, default: 'BOTH' })
  role: UserRole;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'boolean', default: false })
  onboardingCompleted: boolean;

  /** Paystack transfer recipient — created from the seller's bank details.
   *  We store the recipient code + display info only, never the full
   *  account number (Paystack holds it). */
  @Column({ type: 'varchar', length: 64, nullable: true })
  payoutRecipientCode: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  payoutBankName: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  payoutAccountName: string | null;

  @Column({ type: 'varchar', length: 4, nullable: true })
  payoutLast4: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Account, (a) => a.user)
  accounts: Account[];

  @OneToMany(() => Session, (s) => s.user)
  sessions: Session[];

  @OneToMany(() => PasswordResetToken, (t) => t.user)
  passwordResetTokens: PasswordResetToken[];

  /** Never leak the hash — call before sending a user over the wire. */
  toSafeJSON() {
    const { passwordHash: _omit, ...safe } = this as Record<string, unknown> & {
      passwordHash?: unknown;
    };
    void _omit;
    return safe;
  }
}
