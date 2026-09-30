'use client';

import Link from 'next/link';
import {
  ArrowLeftRight,
  Gavel,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  ShieldCheck,
  Store,
  UserRound,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { ApiUser } from '@/lib/api';
import { Logo } from './logo';

export type DashSection = 'overview' | 'transactions' | 'payouts' | 'profile' | 'security' | 'admin';

const NAV: { id: DashSection; label: string; hint: string; Icon: typeof LayoutDashboard; adminOnly?: boolean }[] = [
  { id: 'overview', label: 'Overview', hint: 'Home base', Icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', hint: 'Escrow ledger', Icon: ArrowLeftRight },
  { id: 'payouts', label: 'Payouts', hint: 'Bank & transfers', Icon: Landmark },
  { id: 'profile', label: 'Profile', hint: 'Public identity', Icon: UserRound },
  { id: 'security', label: 'Security', hint: 'Sessions & access', Icon: ShieldCheck },
  { id: 'admin', label: 'Disputes', hint: 'Arbitration', Icon: Gavel, adminOnly: true },
];

export const SECTION_META: Record<DashSection, { title: string; sub: string }> = {
  overview: { title: 'Overview', sub: 'Your position on SecureMarket at a glance.' },
  transactions: { title: 'Transactions', sub: 'Every deal, with its full escrow ledger.' },
  payouts: { title: 'Payouts', sub: 'Where your sales land — bank account and transfers.' },
  profile: { title: 'Profile', sub: 'How counterparties see you.' },
  security: { title: 'Security', sub: 'Verify identity, rotate secrets, control devices.' },
  admin: { title: 'Dispute arbitration', sub: 'Review evidence, then release or refund.' },
};

export function DashboardShell({
  user,
  active,
  onSelect,
  onLogout,
  children,
}: {
  user: ApiUser;
  active: DashSection;
  onSelect: (s: DashSection) => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  function select(s: DashSection) {
    onSelect(s);
    setOpen(false);
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-white">
      <Link href="/" className="flex items-center gap-3 px-5 pb-6 pt-6" onClick={() => setOpen(false)}>
        <Logo size={32} />
        <span className="mono block text-[9.5px] tracking-[0.24em] text-neutral-400">ESCROW</span>
      </Link>

      <p className="px-5 pb-2 text-[10.5px] font-semibold tracking-[0.22em] text-neutral-400">WORKSPACE</p>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.filter((n) => !n.adminOnly || user.role === 'ADMIN').map(({ id, label, hint, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => select(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`group flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                isActive ? 'bg-neutral-950 text-white' : 'text-neutral-600 hover:bg-neutral-100 hover:text-black'
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.25 : 2} className="shrink-0" />
              <span className="flex-1">
                <span className="block text-[13.5px] font-semibold leading-tight">{label}</span>
                <span className={`block text-[11.5px] leading-tight ${isActive ? 'text-neutral-400' : 'text-neutral-400'}`}>
                  {hint}
                </span>
              </span>
              {isActive && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </button>
          );
        })}

        <p className="px-3 pb-1 pt-4 text-[10.5px] font-semibold tracking-[0.22em] text-neutral-400">MARKETPLACE</p>
        <Link
          href="/marketplace"
          onClick={() => setOpen(false)}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-black"
        >
          <Store size={18} className="shrink-0" />
          <span className="flex-1">
            <span className="block text-[13.5px] font-semibold leading-tight">Browse marketplace</span>
            <span className="block text-[11.5px] leading-tight text-neutral-400">Find products & services</span>
          </span>
        </Link>
        <Link
          href="/marketplace/new"
          onClick={() => setOpen(false)}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-black"
        >
          <Plus size={18} className="shrink-0" />
          <span className="flex-1">
            <span className="block text-[13.5px] font-semibold leading-tight">Sell something</span>
            <span className="block text-[11.5px] leading-tight text-neutral-400">List your work</span>
          </span>
        </Link>
        <Link
          href="/marketplace/mine"
          onClick={() => setOpen(false)}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-black"
        >
          <Store size={18} className="shrink-0" />
          <span className="flex-1">
            <span className="block text-[13.5px] font-semibold leading-tight">My listings</span>
            <span className="block text-[11.5px] leading-tight text-neutral-400">Manage your shop</span>
          </span>
        </Link>
      </nav>

      <div className="border-t border-neutral-200 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-neutral-950 font-display text-[15px] font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-semibold leading-tight">{user.name}</span>
            <span className="mono block truncate text-[10.5px] tracking-wider text-neutral-500">@{user.username}</span>
          </span>
          <button
            onClick={onLogout}
            title="Log out"
            aria-label="Log out"
            className="cursor-pointer border border-neutral-200 p-2 text-neutral-500 transition-colors hover:border-neutral-950 hover:bg-neutral-950 hover:text-white"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-950 lg:grid lg:grid-cols-[264px_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-neutral-200 lg:sticky lg:top-0 lg:block lg:h-screen">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-50 lg:hidden ${open ? '' : 'pointer-events-none'}`}>
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-[280px] border-r border-neutral-200 transition-transform duration-200 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="absolute right-3 top-5 cursor-pointer p-1.5 text-neutral-500 hover:text-black"
          >
            <X size={18} />
          </button>
          {sidebar}
        </aside>
      </div>

      {/* Main column */}
      <div className="flex min-h-screen min-w-0 flex-col">
        <header className="sticky top-0 z-40 border-b border-neutral-200 bg-[#fafafa]/90 backdrop-blur-md">
          <div className="flex items-center gap-3 px-5 py-3.5 md:px-8">
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="cursor-pointer border border-neutral-300 p-2 transition-colors hover:border-neutral-950 lg:hidden"
            >
              <Menu size={17} />
            </button>
            <div className="min-w-0">
              <h1 className="truncate font-display text-[19px] font-bold leading-tight tracking-tight">
                {SECTION_META[active].title}
              </h1>
              <p className="hidden truncate text-[12.5px] text-neutral-500 sm:block">
                {SECTION_META[active].sub}
              </p>
            </div>
            <span
              className={`mono ml-auto shrink-0 border px-2 py-1 text-[10px] tracking-[0.18em] ${
                user.emailVerified
                  ? 'border-neutral-950 bg-neutral-950 text-white'
                  : 'border-neutral-300 text-neutral-500'
              }`}
            >
              {user.emailVerified ? '● VERIFIED' : '○ UNVERIFIED'}
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
