'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  BadgeCheck,
  Check,
  Circle,
  KeyRound,
  Layers,
  Mail,
  MonitorSmartphone,
  RefreshCw,
  ShoppingBag,
  Store,
} from 'lucide-react';
import { DashboardShell, type DashSection } from '@/components/dashboard-shell';
import { useAuth } from '@/lib/auth-context';
import { api, type ApiBank, type ApiPayout, type ApiRecipient, type ApiSession, type ApiTransaction } from '@/lib/api';
import { formatNGN } from '@/lib/format';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function Note({ kind, message }: { kind: 'error' | 'ok'; message: string | null }) {
  if (!message) return null;
  return (
    <p
      className={
        kind === 'error'
          ? 'border border-neutral-950 bg-neutral-950 px-3.5 py-2.5 text-[13px] leading-5 text-white'
          : 'border border-neutral-300 bg-neutral-50 px-3.5 py-2.5 text-[13px] leading-5'
      }
    >
      {message}
    </p>
  );
}

function MiniField({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium">{label}</span>
      <input
        {...props}
        className="w-full border border-neutral-300 bg-white px-3.5 py-2.5 text-[14.5px] outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950"
      />
    </label>
  );
}

function CardHeader({ Icon, kicker, title }: { Icon: typeof Mail; kicker: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center border border-neutral-950">
        <Icon size={17} />
      </span>
      <div>
        <p className="text-[10.5px] font-semibold tracking-[0.22em] text-neutral-500">{kicker}</p>
        <h2 className="font-display text-[19px] font-bold leading-tight tracking-tight">{title}</h2>
      </div>
    </div>
  );
}

const VALID_TABS: DashSection[] = ['overview', 'transactions', 'payouts', 'profile', 'security', 'admin'];

function DashboardContent() {
  const { user, loading, refresh, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as DashSection | null;
  const [section, setSection] = useState<DashSection>(
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'overview'
  );

  const [sessions, setSessions] = useState<ApiSession[] | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [txs, setTxs] = useState<ApiTransaction[] | null>(null);

  const [banks, setBanks] = useState<ApiBank[] | null>(null);
  const [recipient, setRecipient] = useState<ApiRecipient | null>(null);
  const [payouts, setPayouts] = useState<ApiPayout[] | null>(null);
  const [bankForm, setBankForm] = useState({ bankCode: '', accountNumber: '' });
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [bankMsg, setBankMsg] = useState<{ kind: 'error' | 'ok'; message: string } | null>(null);
  const [bankBusy, setBankBusy] = useState<'resolve' | 'save' | null>(null);
  const [payoutBusy, setPayoutBusy] = useState<string | null>(null);
  const [payoutNote, setPayoutNote] = useState<{ kind: 'error' | 'ok'; message: string } | null>(null);

  const [disputes, setDisputes] = useState<ApiTransaction[] | null>(null);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolveDecision, setResolveDecision] = useState<'release' | 'refund'>('release');
  const [resolveNote, setResolveNote] = useState('');
  const [resolving, setResolving] = useState(false);
  const [disputeNote, setDisputeNote] = useState<{ kind: 'error' | 'ok'; message: string } | null>(null);

  const [profile, setProfile] = useState({ name: '', username: '', bio: '', avatarUrl: '' });
  const [profileMsg, setProfileMsg] = useState<{ kind: 'error' | 'ok'; message: string } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState<{ kind: 'error' | 'ok'; message: string } | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  const [revoking, setRevoking] = useState<string | null>(null);
  const [sessionNote, setSessionNote] = useState<{ kind: 'error' | 'ok'; message: string } | null>(null);

  // Sync tab with URL search parameter if changed externally
  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam) && tabParam !== section) {
      setSection(tabParam);
    }
  }, [tabParam, section]);

  function handleSelectTab(s: DashSection) {
    setSection(s);
    router.replace(`/dashboard?tab=${s}`, { scroll: false });
  }

  useEffect(() => {
    if (!loading && !user) router.push('/login?next=/dashboard');
    else if (!loading && user && !user.onboardingCompleted) router.push('/onboarding');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name ?? '',
        username: user.username ?? '',
        bio: user.bio ?? '',
        avatarUrl: user.avatarUrl ?? '',
      });
    }
  }, [user]);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await api.sessions();
      setSessions(res.sessions);
    } catch {
      setSessions(null);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadSessions();
      api.myTransactions().then(setTxs).catch(() => setTxs([]));
      api.payoutBanks().then(setBanks).catch(() => setBanks([]));
      api.payoutRecipient().then(setRecipient).catch(() => setRecipient({ saved: false }));
      api.myPayouts().then(setPayouts).catch(() => setPayouts([]));
      if (user.role === 'ADMIN') {
        api.adminDisputes().then(setDisputes).catch(() => setDisputes([]));
      }
    }
  }, [user, loadSessions]);

  if (loading || !user) {
    return (
      <div className="mono flex min-h-screen items-center justify-center bg-[#fafafa] text-[12px] tracking-widest text-neutral-500">
        LOADING…
      </div>
    );
  }

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  const firstName = user.name.split(' ')[0];
  const RoleIcon = user.role === 'BUYER' ? ShoppingBag : user.role === 'SELLER' ? Store : Layers;
  const checklist = [
    { label: 'Account created', done: true },
    { label: 'Role selected', done: user.onboardingCompleted },
    { label: 'Bio added', done: Boolean(user.bio), go: 'profile' as const },
  ];

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (profileSaving) return;
    setProfileMsg(null);
    setProfileSaving(true);
    try {
      await api.updateProfile({
        name: profile.name.trim() || undefined,
        username: profile.username.trim() || undefined,
        bio: profile.bio.trim() || undefined,
        avatarUrl: profile.avatarUrl.trim() || undefined,
      });
      await refresh();
      setProfileMsg({ kind: 'ok', message: 'Profile updated.' });
    } catch (err) {
      setProfileMsg({ kind: 'error', message: err instanceof Error ? err.message : 'Could not save profile.' });
    } finally {
      setProfileSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwSaving) return;
    setPwMsg(null);
    if (pw.next !== pw.confirm) {
      setPwMsg({ kind: 'error', message: 'New passwords do not match.' });
      return;
    }
    setPwSaving(true);
    try {
      const res = await api.changePassword(pw.current, pw.next);
      setPw({ current: '', next: '', confirm: '' });
      setPwMsg({
        kind: 'ok',
        message: `Password updated. ${res.revokedOtherSessions} other session(s) revoked — this device stays logged in.`,
      });
      loadSessions();
    } catch (err) {
      setPwMsg({ kind: 'error', message: err instanceof Error ? err.message : 'Could not change password.' });
    } finally {
      setPwSaving(false);
    }
  }

  async function revoke(id: string) {
    if (revoking) return;
    setRevoking(id);
    setSessionNote(null);
    try {
      await api.revokeSession(id);
      await loadSessions();
      setSessionNote({ kind: 'ok', message: 'Session revoked successfully.' });
    } catch (err) {
      setSessionNote({ kind: 'error', message: err instanceof Error ? err.message : 'Could not revoke session.' });
    } finally {
      setRevoking(null);
    }
  }

  async function revokeOthers() {
    if (revoking) return;
    setRevoking('others');
    setSessionNote(null);
    try {
      const res = await api.revokeOtherSessions();
      setSessionNote({
        kind: 'ok',
        message: res.revoked === 0 ? 'No other active sessions found.' : `Logged out of ${res.revoked} other device(s).`,
      });
      await loadSessions();
    } catch (err) {
      setSessionNote({ kind: 'error', message: err instanceof Error ? err.message : 'Could not revoke sessions.' });
    } finally {
      setRevoking(null);
    }
  }

  async function resolveBank() {
    if (bankBusy) return;
    setBankMsg(null);
    setResolvedName(null);
    if (!/^[0-9]{10}$/.test(bankForm.accountNumber)) {
      setBankMsg({ kind: 'error', message: 'Account number must be exactly 10 digits.' });
      return;
    }
    if (!bankForm.bankCode) {
      setBankMsg({ kind: 'error', message: 'Choose your bank first.' });
      return;
    }
    setBankBusy('resolve');
    try {
      const r = await api.resolveBankAccount(bankForm.accountNumber, bankForm.bankCode);
      setResolvedName(r.accountName);
    } catch (err) {
      setBankMsg({ kind: 'error', message: err instanceof Error ? err.message : 'Account could not be verified.' });
    } finally {
      setBankBusy(null);
    }
  }

  async function saveBank() {
    if (bankBusy || !resolvedName) return;
    setBankBusy('save');
    setBankMsg(null);
    try {
      await api.saveBankAccount(bankForm.accountNumber, bankForm.bankCode);
      const r = await api.payoutRecipient();
      setRecipient(r);
      setResolvedName(null);
      setBankMsg({ kind: 'ok', message: 'Bank account saved. Completed sales will land here.' });
    } catch (err) {
      setBankMsg({ kind: 'error', message: err instanceof Error ? err.message : 'Could not save bank account.' });
    } finally {
      setBankBusy(null);
    }
  }

  async function retryPayout(id: string) {
    if (payoutBusy) return;
    setPayoutBusy(id);
    setPayoutNote(null);
    try {
      const updated = await api.retryPayout(id);
      setPayouts((p) => (p ?? []).map((x) => (x.id === id ? updated : x)));
      setPayoutNote({ kind: 'ok', message: 'Payout retry queued with payment provider.' });
    } catch (err) {
      setPayoutNote({ kind: 'error', message: err instanceof Error ? err.message : 'Retry failed.' });
    } finally {
      setPayoutBusy(null);
    }
  }

  async function submitResolve(e: React.FormEvent) {
    e.preventDefault();
    if (resolving || !resolveId || !resolveNote.trim()) return;
    setResolving(true);
    setDisputeNote(null);
    try {
      await api.resolveDispute(resolveId, resolveDecision, resolveNote.trim());
      setResolveId(null);
      setResolveNote('');
      const [d, t] = await Promise.all([
        api.adminDisputes().catch(() => [] as ApiTransaction[]),
        api.myTransactions().catch(() => [] as ApiTransaction[]),
      ]);
      setDisputes(d);
      setTxs(t);
      setDisputeNote({ kind: 'ok', message: `Dispute decision confirmed as ${resolveDecision}.` });
    } catch (err) {
      setDisputeNote({ kind: 'error', message: err instanceof Error ? err.message : 'Resolution failed.' });
    } finally {
      setResolving(false);
    }
  }

  return (
    <DashboardShell user={user} active={section} onSelect={handleSelectTab} onLogout={handleLogout}>
      {/* ============ OVERVIEW ============ */}
      {section === 'overview' && (
        <div className="space-y-6">
          <div>
            <p className="eyebrow text-neutral-500">DASHBOARD — {user.role}</p>
            <h2 className="mt-2 font-display text-[34px] font-bold leading-none tracking-tight md:text-[44px]">
              Welcome, {firstName}.
            </h2>
            <p className="mono mt-2.5 text-[11.5px] tracking-widest text-neutral-500">
              @{user.username} — MEMBER SINCE {fmtDate(user.createdAt).toUpperCase()}
            </p>
          </div>

          {/* Email verification disabled — no email provider configured. */}

          <div className="grid grid-cols-2 gap-px border border-neutral-200 bg-neutral-200 lg:grid-cols-3">
            {[
              ['ROLE', user.role],
              ['ACTIVE SESSIONS', sessions === null ? (sessionsLoading ? '…' : '—') : String(sessions.length)],
              ['TRANSACTIONS', txs === null ? '…' : String(txs.length)],
            ].map(([k, v]) => (
              <div key={k} className="bg-white px-5 py-4">
                <p className="text-[10.5px] font-semibold tracking-[0.2em] text-neutral-500">{k}</p>
                <p className="mono mt-1.5 text-[19px] font-semibold tabular-nums">{v}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <div className="border border-neutral-200 bg-white p-6 lg:col-span-3">
              <CardHeader Icon={BadgeCheck} kicker="GETTING STARTED" title="Setup checklist" />
              <ul className="mt-5 divide-y divide-neutral-100">
                {checklist.map((c) => (
                  <li key={c.label} className="flex items-center justify-between gap-3 py-3 text-[13.5px]">
                    <span className={`flex items-center gap-2.5 ${c.done ? '' : 'text-neutral-500'}`}>
                      {c.done ? <Check size={16} strokeWidth={2.5} /> : <Circle size={15} className="text-neutral-300" />}
                      {c.label}
                    </span>
                    {!c.done && c.go === 'profile' && (
                      <button onClick={() => setSection('profile')} className="cursor-pointer font-medium underline underline-offset-4">
                        Complete
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mono mt-2 border-t border-neutral-200 pt-4 text-[11px] tracking-widest text-neutral-400">
                {checklist.filter((c) => c.done).length} OF {checklist.length} COMPLETE
              </p>
            </div>

            <div className="bg-neutral-950 p-6 text-white lg:col-span-2">
              <span className="flex h-10 w-10 items-center justify-center border border-neutral-700">
                <RoleIcon size={19} />
              </span>
              <p className="font-display mt-4 text-[24px] font-bold leading-tight">
                {user.role === 'BUYER'
                  ? 'Discover work worth paying for.'
                  : user.role === 'SELLER'
                    ? 'Your skills, held to account.'
                    : 'Both sides of every deal.'}
              </p>
              <p className="mt-2.5 text-[13.5px] leading-6 text-neutral-400">
                {user.role === 'BUYER'
                  ? 'Fund a transaction and it stays secured until you accept delivery.'
                  : 'List your work and buyers fund before you deliver — no chasing invoices.'}
              </p>
              <button
                onClick={() => setSection('profile')}
                className="mt-5 cursor-pointer border border-white px-5 py-2.5 text-[13px] font-medium transition-colors hover:bg-white hover:text-black"
              >
                Polish your profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ TRANSACTIONS ============ */}
      {section === 'transactions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-px border border-neutral-200 bg-neutral-200">
            {[
              ['IN ESCROW', txs === null ? '…' : formatNGN(txs.filter((t) => ['SECURED', 'DELIVERED'].includes(t.status)).reduce((s, t) => s + Number(t.amountKobo), 0))],
              ['COMPLETED', txs === null ? '…' : String(txs.filter((t) => t.status === 'COMPLETED').length)],
              ['OPEN', txs === null ? '…' : String(txs.filter((t) => ['AGREEMENT', 'SECURED', 'DELIVERED', 'DISPUTED'].includes(t.status)).length)],
            ].map(([k, v]) => (
              <div key={k} className="bg-white px-5 py-4">
                <p className="text-[10.5px] font-semibold tracking-[0.2em] text-neutral-500">{k}</p>
                <p className="mono mt-1.5 text-[19px] font-semibold tabular-nums">{v}</p>
              </div>
            ))}
          </div>

          {txs === null ? (
            <p className="mono border border-neutral-200 bg-white py-10 text-center text-[12px] tracking-widest text-neutral-400">LOADING TRANSACTIONS…</p>
          ) : txs.length === 0 ? (
            <div className="border border-neutral-200 bg-white px-6 py-16 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center border border-neutral-950">
                <ArrowLeftRight size={24} />
              </span>
              <h3 className="font-display mx-auto mt-5 max-w-sm text-[26px] font-bold leading-tight">
                No transactions yet.
              </h3>
              <p className="mx-auto mt-2.5 max-w-md text-[13.5px] leading-6 text-neutral-600">
                Every deal you join will appear here with its full escrow ledger —
                agreement, payment secured, delivery, completion.
              </p>
              <Link
                href="/marketplace"
                className="mt-6 inline-block bg-neutral-950 px-6 py-3 text-[13.5px] font-medium text-white transition-colors hover:bg-neutral-800"
              >
                Browse marketplace →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 border border-neutral-200 bg-white">
              {txs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => router.push(`/transactions/${t.id}`)}
                  className="group flex w-full cursor-pointer flex-wrap items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-neutral-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14.5px] font-semibold">{t.listingTitle}</p>
                    <p className="mono mt-0.5 text-[11px] tracking-widest text-neutral-500">
                      {t.code} — {user.id === t.buyerId ? 'BUYING' : 'SELLING'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="mono text-[14.5px] font-semibold tabular-nums">{formatNGN(t.amountKobo)}</span>
                    <span className={`mono px-2 py-0.5 text-[10.5px] tracking-widest ${t.status === 'SECURED' || t.status === 'COMPLETED' ? 'bg-neutral-950 text-white' : 'border border-neutral-300 text-neutral-600'}`}>
                      {t.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ PAYOUTS ============ */}
      {section === 'payouts' && (
        <div className="space-y-6">
          <div className="border border-neutral-200 bg-white p-6">
            <CardHeader Icon={KeyRound} kicker="BANK ACCOUNT" title="Where sales land" />
            <p className="mt-2 text-[13.5px] leading-6 text-neutral-600">
              When a buyer accepts your delivery, escrowed money is sent here automatically.
              We store the bank name + last 4 digits only — never your full account number.
            </p>
            {recipient === null ? (
              <p className="mono mt-4 text-[12px] tracking-widest text-neutral-400">LOADING…</p>
            ) : recipient.saved ? (
              <div className="mt-4 border border-neutral-950 bg-neutral-950 p-4 text-white">
                <p className="mono text-[10.5px] tracking-[0.2em] text-neutral-400">SAVED ACCOUNT</p>
                <p className="mt-1.5 text-[16px] font-semibold">{recipient.accountName}</p>
                <p className="mono mt-0.5 text-[12.5px] tracking-widest text-neutral-300">
                  {recipient.bankName} — •••• {recipient.last4}
                </p>
                <button
                  onClick={() => { setRecipient({ saved: false }); setResolvedName(null); setBankMsg(null); }}
                  className="mono mt-3 cursor-pointer text-[11.5px] tracking-widest text-neutral-400 underline underline-offset-4 hover:text-white"
                >
                  CHANGE ACCOUNT
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3.5">
                <Note kind={bankMsg?.kind ?? 'ok'} message={bankMsg?.message ?? null} />
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-[13px] font-medium">Bank</span>
                    <select
                      value={bankForm.bankCode}
                      onChange={(e) => { setBankForm({ ...bankForm, bankCode: e.target.value }); setResolvedName(null); }}
                      className="w-full cursor-pointer border border-neutral-300 bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-neutral-950"
                    >
                      <option value="">Choose bank…</option>
                      {(banks ?? []).map((b) => (
                        <option key={b.code} value={b.code}>{b.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[13px] font-medium">Account number</span>
                    <input
                      value={bankForm.accountNumber}
                      onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                      placeholder="0123456789"
                      inputMode="numeric"
                      className="mono w-full border border-neutral-300 bg-white px-3.5 py-2.5 text-[14px] outline-none placeholder:text-neutral-400 focus:border-neutral-950"
                    />
                  </label>
                </div>
                {resolvedName ? (
                  <div className="border border-neutral-950 p-4">
                    <p className="mono text-[10.5px] tracking-[0.2em] text-neutral-500">ACCOUNT FOUND</p>
                    <p className="mt-1 text-[15px] font-semibold">{resolvedName}</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={saveBank}
                        disabled={bankBusy !== null}
                        className="flex-1 cursor-pointer bg-neutral-950 py-2.5 text-[13.5px] font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
                      >
                        {bankBusy === 'save' ? 'Saving…' : 'Yes, use this account'}
                      </button>
                      <button
                        onClick={() => setResolvedName(null)}
                        className="cursor-pointer border border-neutral-300 px-4 py-2.5 text-[13px] font-medium"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={resolveBank}
                    disabled={bankBusy !== null}
                    className="w-full cursor-pointer border border-neutral-950 py-2.5 text-[13.5px] font-medium transition-colors hover:bg-neutral-950 hover:text-white disabled:opacity-50"
                  >
                    {bankBusy === 'resolve' ? 'Checking…' : 'Verify account'}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="border border-neutral-200 bg-white p-6">
            <CardHeader Icon={ArrowLeftRight} kicker="TRANSFERS" title="Payout history" />
            <div className="mt-3">
              <Note kind={payoutNote?.kind ?? 'ok'} message={payoutNote?.message ?? null} />
            </div>
            {payouts === null ? (
              <p className="mono mt-4 text-[12px] tracking-widest text-neutral-400">LOADING PAYOUTS…</p>
            ) : payouts.length === 0 ? (
              <p className="mt-3 text-[13.5px] leading-6 text-neutral-600">
                No payouts yet. Complete a sale and the transfer appears here.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-neutral-100 border-y border-neutral-200">
                {payouts.map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div>
                      <p className="text-[14px] font-semibold">{p.listingTitle ?? p.code ?? p.reference}</p>
                      <p className="mono mt-0.5 text-[11.5px] tracking-widest text-neutral-500">
                        {p.code} — {formatNGN(p.amountKobo)}
                        {p.bankName ? ` — ${p.bankName} ••••${p.last4}` : ''}
                      </p>
                      {p.failureReason && (
                        <p className="mt-1 text-[12.5px] text-neutral-600">{p.failureReason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`mono px-2 py-0.5 text-[10.5px] tracking-widest ${p.status === 'SUCCESS' ? 'bg-neutral-950 text-white' : 'border border-neutral-300 text-neutral-600'}`}>
                        {p.status}
                      </span>
                      {p.status !== 'SUCCESS' && (
                        <button
                          onClick={() => retryPayout(p.id)}
                          disabled={payoutBusy !== null}
                          className="cursor-pointer border border-neutral-950 px-3.5 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-neutral-950 hover:text-white disabled:opacity-50"
                        >
                          {payoutBusy === p.id ? 'Retrying…' : 'Retry'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ ADMIN ============ */}
      {section === 'admin' && user.role === 'ADMIN' && (
        <div className="space-y-6">
          <Note kind={disputeNote?.kind ?? 'ok'} message={disputeNote?.message ?? null} />
          <p className="text-[13.5px] leading-6 text-neutral-600">
            Open the deal to read the ledger + chat evidence, then decide. Release pays the seller
            (triggers payout). Refund returns money to the buyer via Paystack when live-funded.
          </p>
          {disputes === null ? (
            <p className="mono border border-neutral-200 bg-white py-10 text-center text-[12px] tracking-widest text-neutral-400">LOADING DISPUTES…</p>
          ) : disputes.length === 0 ? (
            <div className="border border-neutral-200 bg-white px-6 py-16 text-center">
              <p className="font-display mx-auto text-[24px] font-bold">No open disputes.</p>
              <p className="mx-auto mt-2 text-[13.5px] text-neutral-600">Everything is calm.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((d) => (
                <div key={d.id} className="border border-neutral-950 bg-white">
                  <button
                    onClick={() => router.push(`/transactions/${d.id}`)}
                    className="block w-full cursor-pointer px-5 pt-4 text-left hover:bg-neutral-50"
                  >
                    <p className="text-[15px] font-semibold">{d.listingTitle}</p>
                    <p className="mono mt-0.5 text-[11px] tracking-widest text-neutral-500">
                      {d.code} — {formatNGN(d.amountKobo)} — {d.buyer?.name ?? 'buyer'} vs {d.seller?.name ?? 'seller'}
                    </p>
                    {d.disputeReason && (
                      <p className="mt-2 border-l-2 border-neutral-950 pl-3 text-[13px] leading-6 text-neutral-700">
                        “{d.disputeReason}”
                      </p>
                    )}
                    <p className="mono mt-2 text-[11px] tracking-widest text-neutral-400">OPEN DEAL →</p>
                  </button>
                  {resolveId === d.id ? (
                    <form onSubmit={submitResolve} className="space-y-3 border-t border-neutral-200 px-5 py-4">
                      <div className="flex gap-2">
                        {(['release', 'refund'] as const).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setResolveDecision(opt)}
                            className={`flex-1 cursor-pointer border py-2.5 text-[13px] font-medium transition-colors ${
                              resolveDecision === opt ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-300 text-neutral-600 hover:border-neutral-950'
                            }`}
                          >
                            {opt === 'release' ? 'Release to seller' : 'Refund buyer'}
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows={2}
                        value={resolveNote}
                        onChange={(e) => setResolveNote(e.target.value)}
                        placeholder="Reason (shown in the deal history)…"
                        className="w-full border border-neutral-300 px-3.5 py-2.5 text-[13.5px] leading-6 outline-none focus:border-neutral-950"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={resolving || !resolveNote.trim()}
                          className="flex-1 cursor-pointer bg-neutral-950 py-2.5 text-[13px] font-medium text-white disabled:opacity-50"
                        >
                          {resolving ? 'Resolving…' : `Confirm ${resolveDecision}`}
                        </button>
                        <button type="button" onClick={() => setResolveId(null)} className="cursor-pointer border border-neutral-300 px-4 py-2.5 text-[13px] font-medium">
                          Back
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="px-5 py-3">
                      <button
                        onClick={() => { setResolveId(d.id); setResolveDecision('release'); setResolveNote(''); }}
                        className="cursor-pointer border border-neutral-950 px-4 py-2 text-[13px] font-medium transition-colors hover:bg-neutral-950 hover:text-white"
                      >
                        Resolve dispute
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ PROFILE ============ */}
      {section === 'profile' && (
        <div className="grid items-start gap-6 lg:grid-cols-5">
          <div className="bg-neutral-950 p-6 text-white lg:col-span-2">
            <div className="flex h-16 w-16 items-center justify-center bg-white font-display text-[26px] font-bold text-black">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <p className="mt-4 text-[19px] font-semibold">{user.name}</p>
            <p className="mono mt-1 text-[12px] tracking-widest text-neutral-400">@{user.username}</p>
            <p className="mt-3 text-[13.5px] leading-6 text-neutral-400">
              {user.bio || 'No bio yet — add one so counterparties know who they deal with.'}
            </p>
            <div className="mono mt-5 space-y-1.5 border-t border-neutral-800 pt-4 text-[11px] tracking-widest text-neutral-500">
              <p>ID — {user.id.slice(0, 8).toUpperCase()}</p>
              <p>ROLE — {user.role}</p>
            </div>
          </div>

          <form onSubmit={saveProfile} className="space-y-4 border border-neutral-200 bg-white p-6 lg:col-span-3">
            <Note kind={profileMsg?.kind ?? 'ok'} message={profileMsg?.message ?? null} />
            <MiniField label="Display name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Adaeze Okafor" />
            <MiniField label="Username" value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} placeholder="adaeze" />
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium">Short bio</span>
              <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3} maxLength={280} placeholder="What do you do?" className="w-full resize-none border border-neutral-300 bg-white px-3.5 py-2.5 text-[14.5px] outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950" />
            </label>
            <MiniField label="Avatar URL (optional)" value={profile.avatarUrl} onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })} placeholder="https://…" inputMode="url" />
            <button type="submit" disabled={profileSaving} className="w-full cursor-pointer bg-neutral-950 py-3 text-[14px] font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60">
              {profileSaving ? 'Saving…' : 'Save profile'}
            </button>
            <p className="text-[12.5px] text-neutral-500">
              Your profile details are shown to counterparties on your listings and transactions.
            </p>
          </form>
        </div>
      )}

      {/* ============ SECURITY ============ */}
      {section === 'security' && (
        <div className="space-y-6">
          <div className="grid items-start gap-6 lg:grid-cols-2">
            {/* Email verification card removed — no email provider configured. */}

            <form onSubmit={changePassword} className="space-y-3.5 border border-neutral-200 bg-white p-6">
              <CardHeader Icon={KeyRound} kicker="ACCESS" title="Change password" />
              <Note kind={pwMsg?.kind ?? 'ok'} message={pwMsg?.message ?? null} />
              <MiniField label="Current password" type="password" required value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" />
              <div className="grid gap-3.5 sm:grid-cols-2">
                <MiniField label="New password" type="password" required value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" placeholder="Min. 8 characters" />
                <MiniField label="Confirm new" type="password" required value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" />
              </div>
              <button type="submit" disabled={pwSaving} className="w-full cursor-pointer bg-neutral-950 py-2.5 text-[13.5px] font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60">
                {pwSaving ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </div>

          <div className="border border-neutral-200 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center border border-neutral-950">
                  <MonitorSmartphone size={17} />
                </span>
                <div>
                  <p className="text-[10.5px] font-semibold tracking-[0.22em] text-neutral-500">DEVICES</p>
                  <h2 className="font-display text-[19px] font-bold leading-tight tracking-tight">Active sessions</h2>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={loadSessions}
                  disabled={sessionsLoading}
                  title="Refresh sessions"
                  className="cursor-pointer border border-neutral-300 p-2 text-neutral-600 transition-colors hover:border-neutral-950 hover:text-black disabled:opacity-50"
                >
                  <RefreshCw size={15} className={sessionsLoading ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={revokeOthers}
                  disabled={revoking !== null}
                  className="cursor-pointer border border-neutral-950 px-4 py-2 text-[13px] font-medium transition-colors hover:bg-neutral-950 hover:text-white disabled:opacity-50"
                >
                  {revoking === 'others' ? 'Logging out…' : 'Log out other devices'}
                </button>
              </div>
            </div>
            <p className="mt-3 text-[13px] leading-6 text-neutral-600">
              Every device currently authorized to access your account. Revoking a session signs that device out immediately.
            </p>

            <div className="mt-3">
              <Note kind={sessionNote?.kind ?? 'ok'} message={sessionNote?.message ?? null} />
            </div>

            <div className="mt-4 divide-y divide-neutral-100 border-y border-neutral-200">
              {sessionsLoading && <p className="mono py-5 text-[12px] tracking-widest text-neutral-400">LOADING SESSIONS…</p>}
              {!sessionsLoading && sessions?.length === 0 && (
                <p className="py-5 text-[13.5px] text-neutral-500">No active sessions.</p>
              )}
              {sessions?.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-neutral-200 text-neutral-500">
                      <MonitorSmartphone size={16} />
                    </span>
                    <div>
                      <p className="flex items-center gap-2 text-[14px] font-semibold">
                        {s.current ? (
                          <span className="bg-neutral-950 px-2 py-0.5 font-mono text-[10.5px] tracking-widest text-white">THIS DEVICE</span>
                        ) : (
                          <span className="border border-neutral-300 px-2 py-0.5 font-mono text-[10.5px] tracking-widest text-neutral-500">DEVICE</span>
                        )}
                        <span className="mono text-[12px] font-normal text-neutral-500">{s.id.slice(0, 8).toUpperCase()}</span>
                      </p>
                      <p className="mono mt-1 text-[11.5px] tracking-wide text-neutral-500">
                        ACTIVE SINCE {fmtDate(s.createdAt).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  {!s.current && (
                    <button
                      onClick={() => revoke(s.id)}
                      disabled={revoking !== null}
                      className="cursor-pointer border border-neutral-300 px-3.5 py-1.5 text-[12.5px] font-medium transition-colors hover:border-neutral-950 hover:bg-neutral-950 hover:text-white disabled:opacity-50"
                    >
                      {revoking === s.id ? 'Revoking…' : 'Revoke'}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-4 text-[12.5px] text-neutral-500">
              All sessions are protected with encrypted authentication tokens. If you ever notice an unfamiliar session, revoke it immediately and update your password.
            </p>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="mono flex min-h-screen items-center justify-center bg-[#fafafa] text-[12px] tracking-widest text-neutral-500">
          LOADING DASHBOARD…
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
