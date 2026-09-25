'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthShell, Field, FormError, FormNote, Submit } from '@/components/auth-shell';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

const ROLES = [
  { id: 'BUYER', t: 'Buy', d: 'Discover and purchase digital products and services.' },
  { id: 'SELLER', t: 'Sell', d: 'Sell your digital products and services.' },
  { id: 'BOTH', t: 'Both', d: 'Buy and sell.' },
];

export default function OnboardingPage() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState('BOTH');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login?next=/onboarding');
    if (user) {
      setName(user.name ?? '');
      setUsername(user.username ?? '');
      setBio(user.bio ?? '');
      if (user.role) setRole(user.role === 'ADMIN' ? 'BOTH' : user.role);
    }
  }, [user, loading, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setError(null);
    setSaving(true);
    try {
      await api.onboarding({
        role,
        name: name.trim() || undefined,
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      await refresh();
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save onboarding.');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="mono flex min-h-screen items-center justify-center bg-[#fafafa] text-[12px] tracking-widest text-neutral-500">
        LOADING…
      </div>
    );
  }

  return (
    <AuthShell
      eyebrow="ONBOARDING"
      title="How will you use the platform?"
      sub="You can change this later from your settings."
      side={
        <>
          <p className="eyebrow text-neutral-500">PROFILE — {user.email}</p>
          <p className="font-display text-[28px] font-bold leading-tight tracking-tight">
            Set up once.
            <br />
            <span className="text-neutral-500">Transact forever.</span>
          </p>
          <p className="text-[11px] font-medium tracking-widest text-neutral-600">@{user.username} — {user.role}</p>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormError message={error} />
        <div className="grid gap-2">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={`border px-4 py-3.5 text-left transition-colors ${
                role === r.id ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-300 bg-white hover:border-neutral-950'
              }`}
            >
              <span className="text-[14.5px] font-semibold">{r.t}</span>
              <span className={`mt-0.5 block text-[13px] ${role === r.id ? 'text-neutral-300' : 'text-neutral-500'}`}>{r.d}</span>
            </button>
          ))}
        </div>
        <Field label="Display name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Adaeze Okafor" />
        <Field label="Username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="adaeze" />
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium">Short bio</span>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={280} placeholder="What do you do?" className="w-full resize-none border border-neutral-300 bg-white px-3.5 py-2.5 text-[14.5px] outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950" />
        </label>
        <Submit loading={saving}>Continue to dashboard</Submit>
        <FormNote message="Profile image upload arrives with listings — skip for now." />
      </form>
    </AuthShell>
  );
}
