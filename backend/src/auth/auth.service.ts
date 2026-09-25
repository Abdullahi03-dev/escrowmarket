import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { timingSafeEqual } from 'crypto';
import { User } from '../entities/user.entity';
import { Account } from '../entities/account.entity';
import { Session } from '../entities/session.entity';
import { VerificationToken } from '../entities/verification-token.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { OnboardingDto } from './dto/onboarding.dto';
import { ResetPasswordDto } from './dto/password.dto';
import {
  isDev,
  newOneTimeToken,
  newSessionToken,
  sessionExpiry,
  sha256Hex,
} from './auth.utils';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Account) private accounts: Repository<Account>,
    @InjectRepository(Session) private sessions: Repository<Session>,
    @InjectRepository(VerificationToken)
    private verifications: Repository<VerificationToken>,
    @InjectRepository(PasswordResetToken)
    private resets: Repository<PasswordResetToken>,
  ) {}

  // ---------- registration / login / logout / me ----------

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match.');
    }
    const email = dto.email.toLowerCase();
    const username = dto.username.toLowerCase();

    const [emailTaken, usernameTaken] = await Promise.all([
      this.users.findOne({ where: { email } }),
      this.users.findOne({ where: { username } }),
    ]);
    if (emailTaken)
      throw new ConflictException('An account with this email already exists.');
    if (usernameTaken) throw new ConflictException('Username is taken.');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.users.save(
      this.users.create({
        email,
        passwordHash,
        name: dto.name.trim(),
        username,
        role: 'BOTH',
      }),
    );
    await this.accounts.save(
      this.accounts.create({
        userId: user.id,
        provider: 'credentials',
        providerAccountId: email,
      }),
    );
    const verification = await this.issueVerificationToken(email);
    const session = await this.createSession(user.id);
    return { user: this.safe(user), sessionToken: session.raw, verification };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase();
    // passwordHash has select:false — explicitly select it here.
    const user = await this.users.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'passwordHash',
        'name',
        'username',
        'avatarUrl',
        'bio',
        'role',
        'emailVerified',
        'onboardingCompleted',
        'createdAt',
        'updatedAt',
      ],
    });
    if (!user || !user.passwordHash) {
      // Same message either way to avoid account enumeration.
      throw new UnauthorizedException('Invalid email or password.');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid email or password.');
    const session = await this.createSession(user.id);
    return { user: this.safe(user), sessionToken: session.raw };
  }

  async logout(rawToken: string | undefined) {
    if (rawToken) {
      await this.sessions.delete({ tokenHash: sha256Hex(rawToken) });
    }
    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Session user not found.');
    return this.safe(user);
  }

  async validateSession(
    rawToken: string | undefined,
  ): Promise<User | null> {
    if (!rawToken) return null;
    const session = await this.sessions.findOne({
      where: { tokenHash: sha256Hex(rawToken) },
      relations: ['user'],
    });
    if (!session) return null;
    if (session.expiresAt.getTime() < Date.now()) {
      await this.sessions.delete({ id: session.id });
      return null;
    }
    return session.user;
  }

  // ---------- onboarding ----------

  async completeOnboarding(userId: string, dto: OnboardingDto) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found.');

    if (dto.username && dto.username !== user.username) {
      const taken = await this.users.findOne({
        where: { username: dto.username.toLowerCase() },
      });
      if (taken && taken.id !== user.id)
        throw new ConflictException('Username is taken.');
      user.username = dto.username.toLowerCase();
    }
    user.role = dto.role;
    if (dto.name) user.name = dto.name;
    if (dto.bio !== undefined) user.bio = dto.bio;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;
    user.onboardingCompleted = true;
    await this.users.save(user);
    return this.safe(user);
  }

  // ---------- email verification (architecture: token stored hashed) ----------

  async issueVerificationToken(email: string) {
    const raw = newOneTimeToken();
    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000);
    // Replace outstanding tokens for this email.
    await this.verifications.delete({ identifier: email.toLowerCase() });
    await this.verifications.save(
      this.verifications.create({
        identifier: email.toLowerCase(),
        tokenHash: sha256Hex(raw),
        expiresAt,
      }),
    );
    if (!isDev()) {
      // Production: send via email provider here, never return the raw token.
      // eslint-disable-next-line no-console
      console.log(`[auth] verification email queued for ${email}`);
      return { emailed: true as const };
    }
    return { emailed: false as const, devToken: raw };
  }

  async resendVerification(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || !user.email)
      throw new UnauthorizedException('User not found.');
    if (user.emailVerified) return { alreadyVerified: true as const };
    return this.issueVerificationToken(user.email);
  }

  async verifyEmail(token: string) {
    const record = await this.verifications.findOne({
      where: { tokenHash: sha256Hex(token) },
    });
    if (!record || record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Verification link is invalid or expired.');
    }
    const user = await this.users.findOne({
      where: { email: record.identifier },
    });
    if (user) {
      user.emailVerified = true;
      await this.users.save(user);
    }
    await this.verifications.delete({ id: record.id });
    return { ok: true as const, user: user ? this.safe(user) : null };
  }

  // ---------- password reset (generic responses to avoid enumeration) ----------

  async forgotPassword(email: string) {
    const normalized = email.toLowerCase();
    const user = await this.users.findOne({ where: { email: normalized } });
    if (user) {
      const raw = newOneTimeToken();
      await this.resets.save(
        this.resets.create({
          userId: user.id,
          tokenHash: sha256Hex(raw),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        }),
      );
      if (isDev()) {
        return {
          ok: true as const,
          message:
            'If an account exists for this email, a reset link was created.',
          devToken: raw,
        };
      }
      // eslint-disable-next-line no-console
      console.log(`[auth] password reset queued for ${normalized}`);
    }
    // Identical response whether or not the email exists.
    return {
      ok: true as const,
      message:
        'If an account exists for this email, a reset link was created.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.resets.findOne({
      where: { tokenHash: sha256Hex(dto.token) },
      relations: ['user'],
    });
    if (
      !record ||
      record.usedAt ||
      record.expiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Reset link is invalid or expired.');
    }
    record.user.passwordHash = await bcrypt.hash(
      dto.newPassword,
      BCRYPT_ROUNDS,
    );
    await this.users.save(record.user);
    record.usedAt = new Date();
    await this.resets.save(record);
    // Invalidate all sessions so the password change logs devices out.
    await this.sessions.delete({ userId: record.userId });
    return { ok: true as const };
  }

  // ---------- profile ----------

  async updateProfile(
    userId: string,
    dto: { name?: string; username?: string; bio?: string; avatarUrl?: string },
  ) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found.');
    if (dto.username && dto.username !== user.username) {
      const taken = await this.users.findOne({
        where: { username: dto.username.toLowerCase() },
      });
      if (taken && taken.id !== user.id)
        throw new ConflictException('Username is taken.');
      user.username = dto.username.toLowerCase();
    }
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.bio !== undefined) user.bio = dto.bio;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;
    await this.users.save(user);
    return this.safe(user);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    currentRawToken?: string,
  ) {
    const user = await this.users.findOne({
      where: { id: userId },
      select: ['id', 'passwordHash'],
    });
    if (!user || !user.passwordHash) {
      throw new BadRequestException(
        'This account has no password. Use the reset-password flow to set one.',
      );
    }
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Current password is incorrect.');
    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.users.save(user);
    // Keep this device logged in, revoke everything else.
    const revoked = await this.revokeOtherSessions(userId, currentRawToken);
    return { ok: true as const, revokedOtherSessions: revoked };
  }

  // ---------- sessions ----------

  async listSessions(userId: string, currentRawToken?: string) {
    const all = await this.sessions.find({
      where: { userId },
      select: ['id', 'tokenHash', 'createdAt', 'expiresAt'],
      order: { createdAt: 'DESC' },
    });
    const now = Date.now();
    const expired = all.filter((s) => s.expiresAt.getTime() <= now);
    if (expired.length) {
      await this.sessions.delete({ id: In(expired.map((s) => s.id)) });
    }
    const currentHash = currentRawToken ? sha256Hex(currentRawToken) : null;
    return all
      .filter((s) => s.expiresAt.getTime() > now)
      .map((s) => ({
        id: s.id,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        current: currentHash ? this.hashEquals(s.tokenHash, currentHash) : false,
      }));
  }

  async revokeSession(userId: string, sessionId: string, currentRawToken?: string) {
    const session = await this.sessions.findOne({
      where: { id: sessionId, userId },
      select: ['id', 'tokenHash'],
    });
    if (!session) throw new NotFoundException('Session not found.');
    if (currentRawToken && this.hashEquals(session.tokenHash, sha256Hex(currentRawToken))) {
      throw new BadRequestException(
        'This is your current session. Use Log out to end it.',
      );
    }
    await this.sessions.delete({ id: session.id });
    return { ok: true as const };
  }

  async revokeOtherSessions(userId: string, currentRawToken?: string) {
    if (!currentRawToken) {
      const res = await this.sessions.delete({ userId });
      return res.affected ?? 0;
    }
    const all = await this.sessions.find({
      where: { userId },
      select: ['id', 'tokenHash'],
    });
    const others = all.filter(
      (s) => !this.hashEquals(s.tokenHash, sha256Hex(currentRawToken)),
    );
    if (!others.length) return 0;
    await this.sessions.delete({ id: In(others.map((s) => s.id)) });
    return others.length;
  }

  private hashEquals(a: string, b: string): boolean {
    try {
      const ba = Buffer.from(a, 'hex');
      const bb = Buffer.from(b, 'hex');
      return ba.length === bb.length && timingSafeEqual(ba, bb);
    } catch {
      return false;
    }
  }

  // ---------- helpers ----------

  private async createSession(userId: string) {
    const raw = newSessionToken();
    await this.sessions.save(
      this.sessions.create({
        userId,
        tokenHash: sha256Hex(raw),
        expiresAt: sessionExpiry(),
      }),
    );
    return { raw };
  }

  private safe(user: User) {
    const { passwordHash: _omit, ...rest } = user as unknown as Record<
      string,
      unknown
    > & { passwordHash?: unknown };
    void _omit;
    return rest;
  }
}
