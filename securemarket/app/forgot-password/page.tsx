'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AuthShell, Field, FormError, FormNote, Submit } from '@/components/auth-shell';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setNote(null);
    setDevToken(null);
    setLoading(true);
    try {
      const res = await api.forgotPassword(email.trim());
      if (res.devToken) {
        setDevToken(res.devToken);
        setNote('A reset token was generated for your account.');
      } else {
        setNote(res.message || 'If an account exists with this email, you will receive a password reset link shortly.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="ACCOUNT RECOVERY"
      title="Forgot password?"
      sub="Enter your registered email address and we'll send you instructions to safely reset your password."
      side={
        <>
          <p className="eyebrow text-neutral-500">ACCOUNT PROTECTION</p>
          <p className="font-display text-[28px] font-semibold leading-tight tracking-tight">
            Safe recovery.
            <br />
            <span className="text-neutral-500">Every time.</span>
          </p>
          <p className="text-[11px] font-medium tracking-widest text-neutral-600">RESET TOKENS EXPIRE IN 60 MIN</p>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormError message={error} />
        <FormNote message={note} />
        {devToken && (
          <div className="border border-neutral-950 bg-neutral-50 p-4 text-[12.5px]">
            <p className="mono text-[10px] tracking-widest text-neutral-500">DEVELOPMENT ENVIRONMENT</p>
            <p className="mt-1 text-neutral-700">A local reset token was generated for testing:</p>
            <div className="mt-2.5">
              <Link
                href={`/reset-password?token=${devToken}`}
                className="mono inline-flex items-center gap-1.5 border border-neutral-950 bg-white px-3 py-1.5 font-semibold text-neutral-950 transition-colors hover:bg-neutral-950 hover:text-white"
              >
                Proceed to Reset Password →
              </Link>
            </div>
          </div>
        )}
        <Field
          label="Account email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <Submit loading={loading}>Send reset instructions</Submit>
      </form>
      <p className="mt-6 text-center text-[13.5px] text-neutral-600">
        Remembered your password?{' '}
        <Link href="/login" className="font-semibold text-black underline-offset-4 hover:underline">Log in</Link>
      </p>
    </AuthShell>
  );
}
