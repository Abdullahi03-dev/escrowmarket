'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthShell, Field, FormError, FormNote, Submit } from '@/components/auth-shell';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirmPassword: '', terms: false });
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setNote(null);
    if (!form.terms) {
      setError('Please agree to the Terms and Privacy Policy.');
      return;
    }
    setLoading(true);
    try {
      const res = await register({
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      if (res.devToken) {
        setNote(`DEV ONLY — verification token created: ${res.devToken.slice(0, 16)}… (see backend logs / verify-email page)`);
      }
      router.push('/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="CREATE ACCOUNT"
      title="Create your account."
      sub="Start buying and selling digital products securely."
      side={
        <>
          <p className="eyebrow text-neutral-500">ONBOARDING — 2 MIN</p>
          <div>
            <p className="font-display text-[28px] font-bold leading-tight tracking-tight">
              One account.
              <br />
              <span className="text-neutral-500">Buy and sell.</span>
            </p>
            <ul className="mono mt-8 space-y-2.5 text-[11.5px] tracking-widest text-neutral-400">
              <li>01 — CREATE ACCOUNT</li>
              <li>02 — CHOOSE BUY / SELL / BOTH</li>
              <li>03 — COMPLETE PROFILE</li>
            </ul>
          </div>
          <p className="text-[11px] font-medium tracking-widest text-neutral-600">PASSWORDS ARE HASHED — NEVER STORED PLAIN</p>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormError message={error} />
        <FormNote message={note} />
        <Field label="Name" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Adaeze Okafor" autoComplete="name" />
        <Field label="Username" mono="A–Z 0–9 _" required value={form.username} onChange={(e) => set('username', e.target.value)} placeholder="adaeze" autoComplete="username" />
        <Field label="Email" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" autoComplete="email" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" type="password" required value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Min. 8 characters" autoComplete="new-password" />
          <Field label="Confirm password" type="password" required value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} placeholder="Repeat password" autoComplete="new-password" />
        </div>
        <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-5 text-neutral-600">
          <input type="checkbox" checked={form.terms} onChange={(e) => set('terms', e.target.checked)} className="mt-1 accent-black" />
          <span>I agree to the Terms and Privacy Policy</span>
        </label>
        <Submit loading={loading}>Create account</Submit>
      </form>
      <p className="mt-6 text-center text-[13.5px] text-neutral-600">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-black underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
