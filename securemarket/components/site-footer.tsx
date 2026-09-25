import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-950 text-neutral-400">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center bg-white font-mono text-[13px] font-bold text-black">
              S
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-white">
              SecureMarket
            </span>
          </div>
          <p className="mt-4 max-w-xs text-[13.5px] leading-6">
            The digital marketplace where payments stay protected until the
            deal is done.
          </p>
          <p className="mono mt-6 text-[11px] tracking-widest">
            © 2026 SECUREMARKET
          </p>
        </div>
        <div>
          <p className="mono text-[11px] tracking-widest text-neutral-500">PRODUCT</p>
          <ul className="mt-4 space-y-2.5 text-[13.5px]">
            <li><Link href="/marketplace" className="transition-colors hover:text-white">Marketplace</Link></li>
            <li><Link href="/#how-it-works" className="transition-colors hover:text-white">How it works</Link></li>
            <li><Link href="/#sellers" className="transition-colors hover:text-white">For Sellers</Link></li>
          </ul>
        </div>
        <div>
          <p className="mono text-[11px] tracking-widest text-neutral-500">COMPANY</p>
          <ul className="mt-4 space-y-2.5 text-[13.5px]">
            <li><span className="cursor-pointer transition-colors hover:text-white">About</span></li>
            <li><span className="cursor-pointer transition-colors hover:text-white">Contact</span></li>
            <li><span className="cursor-pointer transition-colors hover:text-white">Careers</span></li>
          </ul>
        </div>
        <div>
          <p className="mono text-[11px] tracking-widest text-neutral-500">LEGAL</p>
          <ul className="mt-4 space-y-2.5 text-[13.5px]">
            <li><span className="cursor-pointer transition-colors hover:text-white">Terms</span></li>
            <li><span className="cursor-pointer transition-colors hover:text-white">Privacy</span></li>
            <li><span className="cursor-pointer transition-colors hover:text-white">Disputes</span></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
