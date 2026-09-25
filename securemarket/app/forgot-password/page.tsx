'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AuthShell, Field, FormError, FormNote, Submit } from '@/components/auth-shell';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
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
      const res = await api.forgotPassword(email.trim());
      setNote(
        res.devToken
          ? `DEV ONLY — reset token: ${res.devToken} (paste it on the reset page)`
          : res.message,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="RESET"
      title="Forgot password?"
      sub="We never reveal whether an email exists — you'll see the same message either way."
      side={
        <>
          <p className="eyebrow text-neutral-500">SECURITY — ANTI-ENUMERATION</p>
          <p className="font-display text-[28px] font-semibold leading-tight tracking-tight">
            Same response.
            <br />
            <span className="text-neutral-500">Every time.</span>
          </p>
          <p className="text-[11px] font-medium tracking-widest text-neutral-600">TOKENS EXPIRE IN 60 MIN</p>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormError message={error} />
        <FormNote message={note} />
        <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
        <Submit loading={loading}>Send reset link</Submit>
      </form>
      <p className="mt-6 text-center text-[13.5px] text-neutral-600">
        Remembered it?{' '}
        <Link href="/login" className="font-semibold text-black underline-offset-4 hover:underline">Log in</Link>
      </p>
    </AuthShell>
  );
}
