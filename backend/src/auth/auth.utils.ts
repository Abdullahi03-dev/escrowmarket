import { createHash, randomBytes } from 'crypto';

export const SESSION_COOKIE = 'sm_session';
export const SESSION_TTL_DAYS = 30;

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/** Opaque 256-bit session token, hex-encoded (64 chars). */
export function newSessionToken(): string {
  return randomBytes(32).toString('hex');
}

/** Short numeric-safe verification / reset token (64 hex chars). */
export function newOneTimeToken(): string {
  return randomBytes(32).toString('hex');
}

export function sessionExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + SESSION_TTL_DAYS);
  return d;
}

export function isDev(): boolean {
  return process.env.NODE_ENV !== 'production';
}
