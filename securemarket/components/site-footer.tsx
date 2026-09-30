import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { Logo } from './logo';

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-950 text-neutral-400">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8">
        <div>
          <div className="flex items-center gap-3">
            <Logo size={28} inverted />
          </div>
          <p className="mt-4 max-w-xs text-[13.5px] leading-6 text-neutral-400">
            The Nigerian digital marketplace where buyer funds stay safely locked in escrow until work is delivered and approved.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="mono inline-flex items-center gap-1 border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[10px] tracking-widest text-neutral-300">
              <ShieldCheck size={11} className="text-white" /> PAYSTACK POWERED
            </span>
            <span className="mono border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[10px] tracking-widest text-neutral-300">
              ZERO BUYER ESCROW FEES
            </span>
          </div>
          <p className="mono mt-6 text-[10.5px] tracking-widest text-neutral-500">
            © 2026 SECUREMARKET — ALL RIGHTS RESERVED
          </p>
        </div>

        <div>
          <p className="mono text-[11px] tracking-widest text-neutral-400">MARKETPLACE</p>
          <ul className="mt-4 space-y-2.5 text-[13.5px]">
            <li><Link href="/marketplace" className="transition-colors hover:text-white">Browse Listings</Link></li>
            <li><Link href="/marketplace/new" className="transition-colors hover:text-white">Create a Listing</Link></li>
            <li><Link href="/#how-it-works" className="transition-colors hover:text-white">How Escrow Works</Link></li>
            <li><Link href="/#faq" className="transition-colors hover:text-white">Frequently Asked Questions</Link></li>
          </ul>
        </div>

        <div>
          <p className="mono text-[11px] tracking-widest text-neutral-400">SAFETY & TRUST</p>
          <ul className="mt-4 space-y-2.5 text-[13.5px]">
            <li><Link href="/#faq" className="transition-colors hover:text-white">Dispute Resolution</Link></li>
            <li><Link href="/#faq" className="transition-colors hover:text-white">Seller Payout Rules</Link></li>
            <li><Link href="/#sellers" className="transition-colors hover:text-white">Seller Verification</Link></li>
            <li><Link href="/#how-it-works" className="transition-colors hover:text-white">Buyer Protection Guarantee</Link></li>
          </ul>
        </div>

        <div>
          <p className="mono text-[11px] tracking-widest text-neutral-400">ACCOUNT</p>
          <ul className="mt-4 space-y-2.5 text-[13.5px]">
            <li><Link href="/login" className="transition-colors hover:text-white">Sign In</Link></li>
            <li><Link href="/register" className="transition-colors hover:text-white">Create Account</Link></li>
            <li><Link href="/dashboard" className="transition-colors hover:text-white">User Dashboard</Link></li>
            <li><Link href="/marketplace/mine" className="transition-colors hover:text-white">My Inventory</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
