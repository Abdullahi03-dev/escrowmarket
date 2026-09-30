import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from './logo';

export function AuthShell({
  eyebrow,
  title,
  sub,
  children,
  side,
}: {
  eyebrow: string;
  title: string;
  sub: string;
  children: ReactNode;
  side: ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-[#fafafa] text-neutral-950 md:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12 md:px-16 lg:px-24">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={28} />
        </Link>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-12">
          <p className="eyebrow text-neutral-500">{eyebrow}</p>
          <h1 className="mt-3 font-display text-[34px] font-bold leading-[1.02] tracking-[-0.01em]">
            {title}
          </h1>
          <p className="mt-2 text-[14.5px] leading-6 text-neutral-600">{sub}</p>
          <div className="mt-8">{children}</div>
        </div>
        <p className="mono text-[11px] tracking-widest text-neutral-400">
          PROTECTED BY ESCROW — TX LEDGER
        </p>
      </div>
      <aside className="hidden border-l border-neutral-800 bg-neutral-950 text-white md:flex md:flex-col md:justify-between md:p-12 lg:p-16">
        {side}
      </aside>
    </div>
  );
}

export function Field({
  label,
  mono,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; mono?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between text-[13px] font-medium">
        {label}
        {mono && <span className="mono text-[10px] tracking-widest text-neutral-400">{mono}</span>}
      </span>
      <input
        {...props}
        className="w-full border border-neutral-300 bg-white px-3.5 py-2.5 text-[14.5px] outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950"
      />
    </label>
  );
}

export function Submit({
  loading,
  children,
}: {
  loading: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full bg-neutral-950 py-3 text-[14px] font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? 'Please wait…' : children}
    </button>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="border border-neutral-950 bg-neutral-950 px-3.5 py-2.5 text-[13px] leading-5 text-white">
      {message}
    </p>
  );
}

export function FormNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="mono border border-neutral-300 bg-white px-3.5 py-2.5 text-[11.5px] leading-5 tracking-wide text-neutral-700">
      {message}
    </p>
  );
}
