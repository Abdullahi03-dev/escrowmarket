'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AuthShell, Field, FormError, FormNote, Submit } from '@/components/auth-shell';
import { api } from '@/lib/api';

function VerifyForm() {
  const params = useSearchParams();
  const [token, setToken] = useState(params.get('token') ?? '');
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
      await api.verifyEmail(token.trim());
      setNote('Email verified — you can now use all marketplace features.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="VERIFY"
      title="Verify your email."
      sub="Links expire after 24 hours. Paste the token from your email (or dev logs)."
      side={
        <>
          <p className="eyebrow text-neutral-500">TRUST — VERIFIED IDENTITY</p>
          <p className="font-display text-[28px] font-semibold leading-tight tracking-tight">
            Verified badge.
            <br />
            <span className="text-neutral-500">Earned, not claimed.</span>
          </p>
          <p className="text-[11px] font-medium tracking-widest text-neutral-600">VERIFIED ACCOUNTS ENJOY GREATER TRUST & PROTECTION</p>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormError message={error} />
        <FormNote message={note} />
        <Field label="Verification token" required value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste token" />
        <Submit loading={loading}>Verify email</Submit>
      </form>
      <p className="mt-6 text-center text-[13.5px] text-neutral-600">
        <Link href="/dashboard" className="font-semibold text-black underline-offset-4 hover:underline">Back to dashboard</Link>
      </p>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
