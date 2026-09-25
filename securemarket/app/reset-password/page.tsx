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
      setNote('Password updated — all sessions were revoked. Redirecting to login…');
      setTimeout(() => router.push('/login'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="RESET"
      title="Set a new password."
      sub="Reset links expire after 60 minutes and are single-use."
      side={
        <>
          <p className="eyebrow text-neutral-500">ROTATION — SECURE</p>
          <p className="font-display text-[28px] font-semibold leading-tight tracking-tight">
            One use.
            <br />
            <span className="text-neutral-500">Then it burns.</span>
          </p>
          <p className="text-[11px] font-medium tracking-widest text-neutral-600">ALL SESSIONS REVOKED ON RESET</p>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormError message={error} />
        <FormNote message={note} />
        <Field label="Reset token" mono="FROM EMAIL / DEV" required value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste token" />
        <Field label="New password" type="password" required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Min. 8 characters" autoComplete="new-password" />
        <Submit loading={loading}>Update password</Submit>
      </form>
      <p className="mt-6 text-center text-[13.5px] text-neutral-600">
        <Link href="/login" className="font-semibold text-black underline-offset-4 hover:underline">Back to login</Link>
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
