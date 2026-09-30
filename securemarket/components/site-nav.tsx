'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X, ArrowUpRight, Plus, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Logo } from './logo';

export function SiteNav() {
  const { user, loading, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? 'border-neutral-200 bg-[#fafafa]/90 backdrop-blur-md'
            : 'border-transparent bg-[#fafafa]'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <Logo size={28} />
              <span className="mono hidden rounded-none border border-neutral-300 px-1.5 py-0.5 text-[10px] tracking-widest text-neutral-500 sm:inline">
                ESCROW
              </span>
            </Link>

            <nav className="hidden items-center gap-6 text-[13.5px] font-medium text-neutral-600 md:flex">
              <Link href="/marketplace" className="transition-colors hover:text-black">
                Marketplace
              </Link>
              <Link href="/#how-it-works" className="transition-colors hover:text-black">
                How it works
              </Link>
              <Link href="/#sellers" className="transition-colors hover:text-black">
                For Sellers
              </Link>
              <Link href="/#faq" className="transition-colors hover:text-black">
                FAQ
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            {loading ? (
              <span className="mono text-[11px] tracking-widest text-neutral-400">
                …
              </span>
            ) : user ? (
              <>
                <Link
                  href="/marketplace/new"
                  className="hidden items-center gap-1.5 border border-neutral-300 px-3.5 py-1.5 text-[13px] font-medium transition-colors hover:border-neutral-950 sm:flex"
                >
                  <Plus size={14} /> Sell
                </Link>
                <Link
                  href="/dashboard"
                  className="hidden bg-neutral-950 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-neutral-800 sm:block"
                >
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="hidden cursor-pointer border border-neutral-300 px-3.5 py-2 text-[13px] font-medium text-neutral-600 transition-colors hover:border-neutral-950 hover:text-black md:block"
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

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="flex h-9 w-9 items-center justify-center border border-neutral-300 p-1.5 text-neutral-700 transition-colors hover:border-neutral-950 hover:text-black md:hidden"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 transition-opacity md:hidden ${
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div
          onClick={() => setMobileOpen(false)}
          className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        />
        <div
          className={`absolute right-0 top-0 h-full w-[290px] border-l border-neutral-200 bg-[#fafafa] p-6 shadow-2xl transition-transform duration-200 ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between pb-6 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <Logo size={24} />
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="p-1 text-neutral-500 hover:text-black"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-6 flex flex-col space-y-4">
            <p className="eyebrow text-neutral-400">NAVIGATION</p>
            <Link
              href="/marketplace"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between py-1 text-[15px] font-medium hover:underline"
            >
              <span>Marketplace</span>
              <ArrowUpRight size={15} className="text-neutral-400" />
            </Link>
            <Link
              href="/#how-it-works"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between py-1 text-[15px] font-medium hover:underline"
            >
              <span>How it works</span>
            </Link>
            <Link
              href="/#sellers"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between py-1 text-[15px] font-medium hover:underline"
            >
              <span>For Sellers</span>
            </Link>
            <Link
              href="/#faq"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between py-1 text-[15px] font-medium hover:underline"
            >
              <span>FAQ</span>
            </Link>

            <div className="pt-4 border-t border-neutral-200 space-y-3">
              {user ? (
                <>
                  <p className="eyebrow text-neutral-400">ACCOUNT (@{user.username})</p>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 bg-neutral-950 px-4 py-2.5 text-[14px] font-medium text-white"
                  >
                    <LayoutDashboard size={16} /> Open Dashboard
                  </Link>
                  <Link
                    href="/marketplace/new"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 border border-neutral-950 px-4 py-2.5 text-[14px] font-medium"
                  >
                    <Plus size={16} /> Sell your work
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                    className="flex w-full items-center gap-2 border border-neutral-300 px-4 py-2.5 text-[13.5px] font-medium text-neutral-600 hover:text-black"
                  >
                    <LogOut size={15} /> Log out
                  </button>
                </>
              ) : (
                <>
                  <p className="eyebrow text-neutral-400">GET STARTED</p>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block border border-neutral-300 px-4 py-2.5 text-center text-[14px] font-medium hover:border-neutral-950"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="block bg-neutral-950 px-4 py-2.5 text-center text-[14px] font-medium text-white hover:bg-neutral-800"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
