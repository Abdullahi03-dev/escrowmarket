'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

export function SiteNav() {
  const { user, loading, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'border-neutral-200 bg-[#fafafa]/90 backdrop-blur-md'
          : 'border-transparent bg-[#fafafa]'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center bg-neutral-950 font-mono text-[13px] font-bold text-white">
            S
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            SecureMarket
          </span>
          <span className="mono hidden rounded-none border border-neutral-300 px-1.5 py-0.5 text-[10px] tracking-widest text-neutral-500 sm:inline">
            ESCROW
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-[13.5px] font-medium text-neutral-600 md:flex">
          <Link href="/marketplace" className="transition-colors hover:text-black">
            Marketplace
          </Link>
          <Link href="/#how-it-works" className="transition-colors hover:text-black">
            How it works
          </Link>
          <Link href="/#sellers" className="transition-colors hover:text-black">
            For Sellers
          </Link>
        </nav>

        <div className="flex items-center gap-2.5">
          {loading ? (
            <span className="mono text-[11px] tracking-widest text-neutral-400">
              …
            </span>
          ) : user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden px-3 py-2 text-[13.5px] font-medium text-neutral-700 transition-colors hover:text-black sm:block"
              >
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="cursor-pointer border border-neutral-300 px-4 py-2 text-[13px] font-medium transition-colors hover:border-neutral-950 hover:bg-neutral-950 hover:text-white"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-2 text-[13.5px] font-medium text-neutral-700 transition-colors hover:text-black"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="bg-neutral-950 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-neutral-800"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
