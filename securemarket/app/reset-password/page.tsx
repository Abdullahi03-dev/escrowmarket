'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AuthShell, Field, FormError, FormNote, Submit } from '@/components/auth-shell';
import { api } from '@/lib/api';

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState(params.get('token') ?? '');
  const [pw, setPw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setNote(null);
    setLoading(true);
    try {
      await api.resetPassword(token.trim(), pw);
      setNote('Password updated securely. All previous active sessions were invalidated. Redirecting to login…');
      setTimeout(() => router.push('/login'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed. The token may be expired or invalid.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="SECURITY"
      title="Create new password."
      sub="Choose a strong password to protect your escrow transactions and account wallet."
      side={
        <>
          <p className="eyebrow text-neutral-500">CREDENTIAL SECURITY</p>
          <p className="font-display text-[28px] font-semibold leading-tight tracking-tight">
            Fresh security.
            <br />
            <span className="text-neutral-500">Complete control.</span>
          </p>
          <p className="text-[11px] font-medium tracking-widest text-neutral-600">PREVIOUS SESSIONS REVOKED AUTOMATICALLY</p>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormError message={error} />
        <FormNote message={note} />
        <Field
          label="Reset token"
          mono="FROM EMAIL"
          required
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste verification token"
        />
        <Field
          label="New password"
          type="password"
          required
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
        />
        <Submit loading={loading}>Update password</Submit>
      </form>
      <p className="mt-6 text-center text-[13.5px] text-neutral-600">
        <Link href="/login" className="font-semibold text-black underline-offset-4 hover:underline">Return to login</Link>
      </p>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
