'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AuthShell, Field, FormError, Submit } from '@/components/auth-shell';
import { useAuth } from '@/lib/auth-context';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      router.push(user.onboardingCompleted ? next : '/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="LOG IN"
      title="Welcome back."
      sub="Continue to your account."
      side={
        <>
          <p className="eyebrow text-neutral-500">SESSION — PERSISTENT</p>
          <div>
            <p className="font-display text-[28px] font-bold leading-tight tracking-tight">
              Your money stays protected until the deal is done.
            </p>
            <div className="mono mt-8 border border-neutral-800 p-4 text-[11.5px] leading-6 tracking-widest text-neutral-400">
              TX-83921 — ₦150,000
              <br />
              STATUS: PROTECTED
            </div>
          </div>
          <p className="text-[11px] font-medium tracking-widest text-neutral-600">SECUREMARKET / ESCROW</p>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormError message={error} />
        <Field label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <div>
          <Field label="Password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          <div className="mt-2 text-right">
            <Link href="/forgot-password" className="text-[13px] font-medium text-neutral-600 underline-offset-4 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>
        <Submit loading={loading}>Log in</Submit>
      </form>
      <p className="mt-6 text-center text-[13.5px] text-neutral-600">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-black underline-offset-4 hover:underline">
          Create account
        </Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
