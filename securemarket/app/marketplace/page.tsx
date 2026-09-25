'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, PackageSearch, Plus, Search, ShieldCheck } from 'lucide-react';
import { SiteNav } from '@/components/site-nav';
import { SiteFooter } from '@/components/site-footer';
import { api, type ApiListing } from '@/lib/api';
import { formatNGN } from '@/lib/format';

const KIND_TABS = [
  { value: '', label: 'Everything' },
  { value: 'PRODUCT', label: 'Products' },
  { value: 'SERVICE', label: 'Services' },
];

function MarketplaceInner() {
  const router = useRouter();
  const [items, setItems] = useState<ApiListing[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listings({ q, kind, category, sort, page, limit: 9 });
      setItems(res.items);
      setTotal(res.total);
      setPages(res.pages);
      setCategories(res.categories);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [q, kind, category, sort, page]);

  useEffect(() => {
    const t = setTimeout(load, q ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  function resetPage() {
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-950">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-5 pb-24 pt-28 md:px-8">
        {/* Header — editorial, not a centered hero */}
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow text-neutral-500">
              MARKETPLACE — {loading ? '…' : `${total} LISTING${total === 1 ? '' : 'S'}`}
            </p>
            <h1 className="mt-3 font-display text-[44px] font-bold leading-[0.95] tracking-tight md:text-[72px]">
              Buy it safe.
              <br />
              <span className="text-neutral-400">Sell it sure.</span>
            </h1>
            <p className="mt-4 max-w-md text-[14.5px] leading-6 text-neutral-600">
              Every purchase is held in escrow — the seller only gets paid when you accept the work.
            </p>
          </div>
          <div className="lg:justify-self-end">
            <Link
              href="/marketplace/new"
              className="flex items-center gap-2 bg-neutral-950 px-6 py-3.5 text-[14px] font-medium text-white transition-colors hover:bg-neutral-800"
            >
              <Plus size={16} /> Sell your work
            </Link>
            <p className="mono mt-2.5 text-[11px] tracking-widest text-neutral-400">
              NO FEES WHILE IN TEST MODE
            </p>
          </div>
        </div>

        {/* Filter deck */}
        <div className="mt-10 border border-neutral-950 bg-white">
          <label className="flex items-center gap-3 border-b border-neutral-200 px-5 py-4">
            <Search size={18} className="shrink-0 text-neutral-400" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); resetPage(); }}
              placeholder="Search courses, templates, services…"
              className="w-full bg-transparent font-display text-[18px] font-medium outline-none placeholder:text-neutral-300"
            />
            {q && (
              <button
                onClick={() => { setQ(''); resetPage(); }}
                className="mono shrink-0 text-[11px] tracking-widest text-neutral-400 underline underline-offset-4 hover:text-black"
              >
                CLEAR
              </button>
            )}
          </label>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3.5">
            <div className="flex gap-1 border border-neutral-200 p-1">
              {KIND_TABS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setKind(t.value); resetPage(); }}
                  className={`cursor-pointer px-4 py-1.5 text-[13px] font-medium transition-colors ${
                    kind === t.value ? 'bg-neutral-950 text-white' : 'text-neutral-500 hover:text-black'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-[13px] font-medium text-neutral-600">
              Category
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); resetPage(); }}
                className="cursor-pointer border border-neutral-200 bg-transparent px-2.5 py-1.5 text-[13px] font-medium text-black outline-none focus:border-neutral-950"
              >
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="ml-auto flex items-center gap-2 text-[13px] font-medium text-neutral-600">
              Sort
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); resetPage(); }}
                className="cursor-pointer border border-neutral-200 bg-transparent px-2.5 py-1.5 text-[13px] font-medium text-black outline-none focus:border-neutral-950"
              >
                <option value="newest">Newest</option>
                <option value="price-asc">Cheapest</option>
                <option value="price-desc">Priciest</option>
              </select>
            </label>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="mt-px border border-t-0 border-neutral-200 bg-white py-20 text-center">
            <p className="mono text-[12px] tracking-widest text-neutral-400">LOADING LISTINGS…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="mt-px border border-t-0 border-neutral-200 bg-white px-6 py-20 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center border border-neutral-950">
              <PackageSearch size={24} />
            </span>
            <p className="font-display mx-auto mt-5 text-[26px] font-bold">Nothing found.</p>
            <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-6 text-neutral-600">
              {q || category || kind
                ? 'Try fewer filters — or be the first to list it.'
                : 'No listings yet — be the first to sell.'}
            </p>
            {(q || category || kind) && (
              <button
                onClick={() => { setQ(''); setKind(''); setCategory(''); resetPage(); }}
                className="mt-5 cursor-pointer border border-neutral-950 px-5 py-2.5 text-[13px] font-medium transition-colors hover:bg-neutral-950 hover:text-white"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <ol className="mt-px divide-y divide-neutral-200 border border-t-0 border-neutral-200 bg-white">
              {items.map((l, i) => (
                <li key={l.id}>
                  <button
                    onClick={() => router.push(`/marketplace/${l.id}`)}
                    className="group grid w-full cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-5 text-left transition-colors hover:bg-neutral-950 hover:text-white md:gap-8 md:px-8"
                  >
                    <span className="mono text-[12px] tracking-widest text-neutral-300 transition-colors group-hover:text-neutral-500">
                      {String((page - 1) * 9 + i + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0">
                      <span className="mono block text-[10.5px] tracking-[0.2em] text-neutral-400 transition-colors group-hover:text-neutral-400">
                        {l.category.toUpperCase()} · {l.kind} · {l.salesCount} SALE{l.salesCount === 1 ? '' : 'S'}
                      </span>
                      <span className="mt-1.5 block truncate font-display text-[20px] font-bold leading-tight tracking-tight md:text-[24px]">
                        {l.title}
                      </span>
                      <span className="mt-1 hidden truncate text-[13px] text-neutral-500 transition-colors group-hover:text-neutral-400 md:block">
                        {l.description}
                      </span>
                      <span className="mono mt-1.5 block text-[11.5px] tracking-widest text-neutral-500 transition-colors group-hover:text-neutral-400">
                        @{l.seller?.username ?? 'seller'}
                        {l.seller?.emailVerified ? ' ✓' : ''}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-2">
                      <span className="mono text-[19px] font-semibold tabular-nums md:text-[22px]">
                        {formatNGN(l.priceKobo)}
                      </span>
                      <span className="flex items-center gap-1 text-[12.5px] font-medium opacity-0 transition-opacity group-hover:opacity-100">
                        View <ArrowUpRight size={14} />
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>

            <div className="mt-6 flex items-center justify-between">
              <p className="mono text-[11.5px] tracking-widest text-neutral-400">
                PAGE {page} OF {pages} — {total} TOTAL
              </p>
              {pages > 1 && (
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="cursor-pointer border border-neutral-300 px-4 py-2 text-[13px] font-medium transition-colors hover:border-neutral-950 disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <button
                    disabled={page >= pages}
                    onClick={() => setPage((p) => p + 1)}
                    className="cursor-pointer border border-neutral-300 px-4 py-2 text-[13px] font-medium transition-colors hover:border-neutral-950 disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Escrow reassurance */}
        <div className="mt-12 grid gap-px border border-neutral-200 bg-neutral-200 md:grid-cols-3">
          {[
            ['01 — Fund', 'Buyer pays into escrow first.'],
            ['02 — Deliver', 'Seller delivers the work.'],
            ['03 — Release', 'Money moves only on accept.'],
          ].map(([t, s]) => (
            <div key={t} className="flex items-center gap-3 bg-white px-5 py-4">
              <ShieldCheck size={17} className="shrink-0" />
              <p className="text-[13px] leading-5"><span className="font-semibold">{t}.</span> <span className="text-neutral-600">{s}</span></p>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense>
      <MarketplaceInner />
    </Suspense>
  );
}
