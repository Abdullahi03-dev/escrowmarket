import Link from 'next/link';
import { SiteNav } from '@/components/site-nav';
import { SiteFooter } from '@/components/site-footer';
import { MarketplacePreview } from '@/components/marketplace-preview';

const STEPS = ['PAYMENT INITIATED', 'FUNDS SECURED', 'DELIVERY SUBMITTED', 'PAYMENT RELEASED'];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-950">
      <SiteNav />

      {/* ============ HERO ============ */}
      <section className="blueprint border-b border-neutral-200 pt-16">
        <div className="mx-auto grid max-w-7xl gap-0 px-5 md:grid-cols-[1.15fr_0.85fr] md:px-8">
          <div className="flex flex-col justify-center border-neutral-200 py-14 md:border-r md:py-24 md:pr-14">
            <p className="eyebrow flex items-center gap-2 text-neutral-500">
              <span className="escrow-live inline-block h-1.5 w-1.5 rounded-full bg-neutral-950" />
              ESCROW-PROTECTED MARKETPLACE
            </p>
            <h1 className="mt-6 font-display text-[52px] font-bold leading-[0.98] tracking-[-0.02em] sm:text-[76px] lg:text-[92px]">
              Trade with
              <br />
              confidence.
            </h1>
            <p className="mt-6 max-w-md text-[16.5px] leading-7 text-neutral-600">
              A digital marketplace where payments stay protected until the
              deal is done.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/marketplace"
                className="bg-neutral-950 px-6 py-3.5 text-[14px] font-medium text-white transition-colors hover:bg-neutral-800"
              >
                Explore Marketplace
              </Link>
              <Link
                href="/register"
                className="border border-neutral-950 px-6 py-3.5 text-[14px] font-medium transition-colors hover:bg-neutral-950 hover:text-white"
              >
                Start Selling
              </Link>
            </div>
            <div className="mono mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-neutral-200 pt-5 text-[11px] tracking-widest text-neutral-500">
              {STEPS.map((s, i) => (
                <span
                  key={s}
                  className="escrow-step"
                  style={{ animationDelay: `${i * 0.8}s` }}
                >
                  {s}
                  {i < STEPS.length - 1 && <span className="ml-6 text-neutral-300">/</span>}
                </span>
              ))}
            </div>
          </div>

          {/* Hero transaction instrument — the product, not an illustration */}
          <div className="flex items-center py-10 md:py-24 md:pl-14">
            <div className="w-full border border-neutral-950 bg-white shadow-[8px_8px_0_0_#0a0a0a]">
              <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
                <span className="mono text-[11px] tracking-[0.2em] text-neutral-500">
                  TRANSACTION
                </span>
                <span className="mono bg-neutral-950 px-2 py-1 text-[11px] tracking-widest text-white">
                  TX-83921
                </span>
              </div>
              <div className="px-5 py-6">
                <p className="text-[13px] font-medium text-neutral-500">Next.js Website</p>
                <p className="mono mt-1 text-[38px] font-semibold tracking-tight">₦150,000</p>
                <div className="mt-4 flex items-center gap-2 border border-neutral-950 bg-neutral-950 px-3 py-2">
                  <span className="escrow-live inline-block h-1.5 w-1.5 rounded-full bg-white" />
                  <span className="mono text-[11px] tracking-[0.2em] text-white">
                    PAYMENT SECURED
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-2 divide-x divide-neutral-200 border-y border-neutral-200">
                  <div className="py-3 pr-4">
                    <p className="mono text-[10px] tracking-[0.2em] text-neutral-400">BUYER</p>
                    <p className="mt-1 text-[14px] font-semibold">Musa</p>
                  </div>
                  <div className="py-3 pl-4">
                    <p className="mono text-[10px] tracking-[0.2em] text-neutral-400">SELLER</p>
                    <p className="mt-1 text-[14px] font-semibold">Abdullahi</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4">
                  <span className="mono text-[10px] tracking-[0.2em] text-neutral-400">STATUS</span>
                  <span className="mono border border-neutral-950 px-2 py-1 text-[11px] tracking-widest">
                    ● PROTECTED
                  </span>
                </div>
              </div>
              <div className="mono flex justify-between border-t border-neutral-200 bg-neutral-50 px-5 py-2.5 text-[10.5px] tracking-widest text-neutral-500">
                <span>AGREEMENT #A-1042</span>
                <span>HELD IN ESCROW</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TRUST STRIP ============ */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 md:flex-row md:items-center md:justify-between md:px-8">
          <p className="eyebrow text-neutral-500">
            BUILT FOR DIGITAL TRANSACTIONS
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[12px] font-semibold tracking-[0.14em]">
            {['PRODUCTS', 'SERVICES', 'SOFTWARE', 'CREATORS', 'DEVELOPERS', 'DESIGNERS'].map((t) => (
              <span key={t} className="border-l border-neutral-300 pl-5 first:border-0 first:pl-0">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" className="border-b border-neutral-200">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-end">
            <div>
              <p className="eyebrow text-neutral-500">01 — PROCESS</p>
              <h2 className="mt-4 font-display text-[36px] font-bold leading-[1.02] tracking-[-0.01em] md:text-[52px]">
                How it works.
              </h2>
            </div>
            <p className="max-w-lg text-[15.5px] leading-7 text-neutral-600 md:justify-self-end">
              Four states. One ledger. Every naira is accounted for from
              agreement to completion — no blind trust required.
            </p>
          </div>

          <div className="mt-14 grid border-t border-neutral-950 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: '01', t: 'Agree', d: 'Buyer and seller agree on the product, service, price and delivery terms.' },
              { n: '02', t: 'Secure', d: 'The buyer funds the transaction and the payment is marked as secured.' },
              { n: '03', t: 'Deliver', d: 'The seller delivers the agreed product or service.' },
              { n: '04', t: 'Complete', d: 'The buyer accepts the delivery and the transaction moves toward completion.' },
            ].map((s, i) => (
              <div
                key={s.n}
                className={`border-b border-neutral-200 px-6 py-8 lg:border-b-0 ${
                  i !== 0 ? 'sm:border-l' : ''
                } ${i % 2 === 1 ? 'sm:border-l' : ''} lg:border-l lg:first:border-l-0`}
              >
                <p className="text-[64px] font-semibold leading-none tracking-[-0.04em] text-neutral-200">
                  {s.n}
                </p>
                <p className="mt-4 text-[19px] font-semibold tracking-tight">{s.t}</p>
                <p className="mt-2 text-[14px] leading-6 text-neutral-600">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TRANSACTION VISUALIZATION ============ */}
      <section className="border-b border-neutral-800 bg-neutral-950 text-white">
        <div className="blueprint-dark mx-auto grid max-w-7xl gap-12 px-5 py-20 md:grid-cols-2 md:items-center md:px-8 md:py-28">
          <div>
            <p className="eyebrow text-neutral-400">02 — LIFECYCLE</p>
            <h2 className="mt-4 font-display text-[36px] font-bold leading-[1.02] tracking-[-0.01em] md:text-[52px]">
              One transaction.
              <br />
              <span className="text-neutral-400">Fully traceable.</span>
            </h2>
            <p className="mt-5 max-w-md text-[15.5px] leading-7 text-neutral-400">
              No paragraphs needed — the ledger explains itself. Every state
              change is recorded against the transaction both sides can see.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-block border border-white px-6 py-3 text-[14px] font-medium transition-colors hover:bg-white hover:text-black"
            >
              Create your first transaction
            </Link>
          </div>
          <div className="border border-neutral-700 bg-neutral-900">
            <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-3.5">
              <span className="mono text-[11px] tracking-[0.2em] text-neutral-400">
                TRANSACTION #TX-83921
              </span>
              <span className="mono text-[11px] tracking-widest text-neutral-500">ESCROW</span>
            </div>
            <div className="px-5 py-5">
              <p className="text-[15px] font-medium">Next.js Website</p>
              <p className="mono mt-1 text-[30px] font-semibold">₦150,000</p>
              <div className="my-5 h-px bg-neutral-800" />
              <ul className="space-y-3.5 font-mono text-[12px] tracking-[0.12em]">
                {[
                  ['✓', 'AGREEMENT CREATED', true],
                  ['✓', 'PAYMENT SECURED', true],
                  ['✓', 'DELIVERY SUBMITTED', true],
                  ['●', 'BUYER REVIEW', false],
                  ['○', 'COMPLETED', false],
                ].map(([mark, label, done]) => (
                  <li
                    key={label as string}
                    className={`flex items-center gap-3 ${done ? 'text-white' : 'text-neutral-500'}`}
                  >
                    <span className={done ? '' : 'escrow-live'}>{mark}</span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mono flex justify-between border-t border-neutral-800 px-5 py-3 text-[10.5px] tracking-widest text-neutral-500">
              <span>3 OF 5 STATES COMPLETE</span>
              <span>AWAITING BUYER</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ MARKETPLACE PREVIEW ============ */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow text-neutral-500">03 — MARKETPLACE</p>
              <h2 className="mt-4 max-w-xl font-display text-[36px] font-bold leading-[1.02] tracking-[-0.01em] md:text-[52px]">
                Real listings, real sellers.
              </h2>
            </div>
            <Link
              href="/marketplace"
              className="group text-[14px] font-medium"
            >
              Explore Marketplace <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
          <MarketplacePreview />
        </div>
      </section>

      {/* ============ SELLER ============ */}
      <section id="sellers" className="border-b border-neutral-200">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 md:grid-cols-2 md:items-center md:px-8 md:py-28">
          <div className="order-2 border border-neutral-950 bg-white shadow-[8px_8px_0_0_#0a0a0a] md:order-1">
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
              <span className="text-[11px] font-semibold tracking-[0.2em] text-neutral-500">SELLER OVERVIEW</span>
              <span className="mono text-[11px] text-neutral-500">@abdullahi</span>
            </div>
            {[
              ['Brand Identity Sprint', 'TX-83921', '₦120,000', 'PROTECTED'],
              ['Python for Fintech', 'TX-83904', '₦25,000', 'DELIVERED'],
              ['Afrobeats Drum Kit', 'TX-83877', '₦12,000', 'COMPLETED'],
            ].map(([title, id, price, status]) => (
              <div key={id} className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 last:border-0">
                <div>
                  <p className="text-[14px] font-semibold">{title}</p>
                  <p className="mono mt-0.5 text-[11px] tracking-widest text-neutral-500">{id}</p>
                </div>
                <div className="text-right">
                  <p className="mono text-[14px] font-semibold">{price}</p>
                  <p className="mono mt-0.5 text-[10px] tracking-widest text-neutral-500">{status}</p>
                </div>
              </div>
            ))}
            <div className="mono flex justify-between bg-neutral-950 px-5 py-3 text-[11px] tracking-widest text-white">
              <span>EARNINGS (30D)</span>
              <span>₦157,000</span>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <p className="eyebrow text-neutral-500">04 — FOR SELLERS</p>
            <h2 className="mt-4 font-display text-[36px] font-bold leading-[1.02] tracking-[-0.01em] md:text-[52px]">
              Turn your skills into trusted transactions.
            </h2>
            <p className="mt-5 max-w-md text-[15.5px] leading-7 text-neutral-600">
              Sell digital products and services without asking strangers to
              trust you blindly. Every transaction has a clear agreement,
              delivery flow and transaction history.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-block bg-neutral-950 px-6 py-3.5 text-[14px] font-medium text-white transition-colors hover:bg-neutral-800"
            >
              Start Selling
            </Link>
          </div>
        </div>
      </section>

      {/* ============ BUYER ============ */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 md:grid-cols-[0.9fr_1.1fr] md:px-8 md:py-28">
          <div>
            <p className="eyebrow text-neutral-500">05 — FOR BUYERS</p>
            <h2 className="mt-4 font-display text-[36px] font-bold leading-[1.02] tracking-[-0.01em] md:text-[52px]">
              Know exactly what you&apos;re paying for.
            </h2>
          </div>
          <div className="grid gap-px border border-neutral-200 bg-neutral-200 sm:grid-cols-2">
            {[
              ['CLEAR TERMS', 'Price, scope and delivery terms recorded before money moves.'],
              ['SELLER RECORD', 'History and identity attached to every transaction.'],
              ['DELIVERY TRACKING', 'Submissions arrive through the transaction, not DMs.'],
              ['DISPUTE PATH', 'A review workflow exists when something goes wrong.'],
            ].map(([t, d]) => (
              <div key={t} className="bg-white p-6">
                <p className="text-[11px] font-semibold tracking-[0.18em]">{t}</p>
                <p className="mt-2 text-[14px] leading-6 text-neutral-600">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TRUST & SAFETY ============ */}
      <section className="border-b border-neutral-200">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <p className="eyebrow text-neutral-500">06 — TRUST & SAFETY</p>
          <h2 className="mt-4 max-w-2xl font-display text-[36px] font-bold leading-[1.02] tracking-[-0.01em] md:text-[52px]">
            Mechanisms, not promises.
          </h2>
          <div className="mt-12 grid border-t border-neutral-950 md:grid-cols-4">
            {[
              ['LOCKED ESCROW VAULT', 'Buyer funds are captured by Paystack and held in an isolated escrow vault before any work or delivery begins.'],
              ['PROOF-OF-DELIVERY', 'Sellers submit verifiable files, access keys, or tracking links directly into the immutable deal room.'],
              ['BUYER INSPECTION WINDOW', 'Buyers inspect deliverables and confirm satisfaction before any funds can ever be released.'],
              ['EVIDENCE-BASED DISPUTES', 'If terms are contested, a human mediator reviews timestamped deal logs and deliverables to arbitrate fairly.'],
            ].map(([t, d], i) => (
              <div key={t} className={`border-b border-neutral-200 py-8 pr-8 md:border-b-0 ${i !== 0 ? 'md:border-l md:pl-8' : ''}`}>
                <p className="text-[12px] font-semibold tracking-[0.16em]">{t}</p>
                <p className="mt-3 text-[14px] leading-6 text-neutral-600">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ / CLARITY ============ */}
      <section id="faq" className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-start">
            <div>
              <p className="eyebrow text-neutral-500">07 — CLEAR ANSWERS</p>
              <h2 className="mt-4 font-display text-[36px] font-bold leading-[1.02] tracking-[-0.01em] md:text-[52px]">
                Frequently asked questions.
              </h2>
              <p className="mt-4 max-w-sm text-[15px] leading-7 text-neutral-600">
                Escrow protects both sides of every transaction. Here is exactly what happens at each step.
              </p>
            </div>

            <div className="divide-y divide-neutral-200 border border-neutral-200">
              {[
                {
                  q: 'Where does my money go when I fund a deal?',
                  a: 'Your payment goes straight into a dedicated escrow vault managed with our licensed payment partners. The seller cannot withdraw or access your money until you personally verify the delivery and click "Accept & release".',
                },
                {
                  q: 'What if the seller doesn’t deliver or sends the wrong files?',
                  a: 'You can tap "Report a problem" inside your private transaction room at any time. The funds remain locked in escrow immediately. You can communicate via transaction chat to resolve it, or request neutral arbitration for a full refund.',
                },
                {
                  q: 'How and when do sellers receive payment?',
                  a: 'The moment the buyer reviews and accepts delivery, the escrow is completed and a payout is automatically queued to your verified Nigerian bank account via Paystack.',
                },
                {
                  q: 'Are there any hidden fees or charges?',
                  a: 'Currently, SecureMarket is operating with 0% platform transaction fees. What you agree on is what is paid.',
                },
                {
                  q: 'Do I need separate accounts for buying and selling?',
                  a: 'No. A single SecureMarket account lets you both purchase digital products and list your own services, managed from one dashboard.',
                },
              ].map((item, i) => (
                <div key={item.q} className="p-6 md:p-8">
                  <p className="flex items-center gap-3 font-display text-[18px] font-bold leading-snug">
                    <span className="mono text-[12px] text-neutral-400">0{i + 1}</span>
                    {item.q}
                  </p>
                  <p className="mt-3 text-[14.5px] leading-6 text-neutral-600 pl-7">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="bg-neutral-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-24 text-center md:py-36">
          <p className="eyebrow text-neutral-500">SECUREMARKET</p>
          <h2 className="mx-auto mt-6 max-w-3xl font-display text-[44px] font-bold leading-[0.98] tracking-[-0.02em] sm:text-[64px]">
            The safer way to trade digital.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[15.5px] leading-7 text-neutral-400">
            Buy products. Hire talent. Sell your work. Keep the transaction clear.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/marketplace"
              className="bg-white px-7 py-3.5 text-[14px] font-medium text-black transition-colors hover:bg-neutral-200"
            >
              Explore Marketplace
            </Link>
            <Link
              href="/register"
              className="border border-white px-7 py-3.5 text-[14px] font-medium transition-colors hover:bg-white hover:text-black"
            >
              Start Selling
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
