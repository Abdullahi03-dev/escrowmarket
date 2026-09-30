'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, LayoutGrid, List, PackageSearch, Plus, Search, ShieldCheck } from 'lucide-react';
import { SiteNav } from '@/components/site-nav';
import { SiteFooter } from '@/components/site-footer';
import { api, type ApiListing } from '@/lib/api';
import { formatNGN } from '@/lib/format';

const KIND_TABS = [
  { value: '', label: 'Everything' },
  { value: 'PRODUCT', label: 'Products' },
  { value: 'SERVICE', label: 'Services' },
];

const POPULAR_CATEGORIES = [
  'All',
  'Software',
  'Template',
  'Course',
  'Design Asset',
  'Service',
  'Audio',
  'Ebook',
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listings({ q, kind, category, sort, page, limit: 12 });
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
        {/* Header */}
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow text-neutral-500">
              MARKETPLACE — {loading ? '…' : `${total} LISTING${total === 1 ? '' : 'S'}`}
            </p>
            <h1 className="mt-3 font-display text-[44px] font-bold leading-[0.95] tracking-tight md:text-[68px]">
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
              0% PLATFORM FEES IN TEST MODE
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
              placeholder="Search courses, templates, services, code…"
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

          {/* Category chips */}
          <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-neutral-50/50 px-5 py-3">
            <span className="mono text-[10.5px] tracking-widest text-neutral-400 mr-2">CATEGORIES:</span>
            {POPULAR_CATEGORIES.map((cat) => {
              const active = cat === 'All' ? !category : category.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat === 'All' ? '' : cat);
                    resetPage();
                  }}
                  className={`cursor-pointer px-3 py-1 text-[12px] font-medium transition-colors ${
                    active
                      ? 'border border-neutral-950 bg-neutral-950 text-white'
                      : 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-950 hover:text-black'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-3.5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-1 border border-neutral-200 p-1">
                {KIND_TABS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => { setKind(t.value); resetPage(); }}
                    className={`cursor-pointer px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                      kind === t.value ? 'bg-neutral-950 text-white' : 'text-neutral-500 hover:text-black'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {categories.length > 0 && (
                <label className="flex items-center gap-2 text-[12.5px] font-medium text-neutral-600">
                  More
                  <select
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); resetPage(); }}
                    className="cursor-pointer border border-neutral-200 bg-transparent px-2.5 py-1.5 text-[12.5px] font-medium text-black outline-none focus:border-neutral-950"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <div className="flex items-center gap-4 ml-auto">
              <label className="flex items-center gap-2 text-[12.5px] font-medium text-neutral-600">
                Sort
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); resetPage(); }}
                  className="cursor-pointer border border-neutral-200 bg-transparent px-2.5 py-1.5 text-[12.5px] font-medium text-black outline-none focus:border-neutral-950"
                >
                  <option value="newest">Newest</option>
                  <option value="price-asc">Cheapest</option>
                  <option value="price-desc">Priciest</option>
                </select>
              </label>

              {/* View mode toggle */}
              <div className="hidden sm:flex border border-neutral-200 p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                  aria-label="Grid view"
                  className={`p-1.5 transition-colors ${
                    viewMode === 'grid' ? 'bg-neutral-950 text-white' : 'text-neutral-400 hover:text-black'
                  }`}
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  title="List view"
                  aria-label="List view"
                  className={`p-1.5 transition-colors ${
                    viewMode === 'list' ? 'bg-neutral-950 text-white' : 'text-neutral-400 hover:text-black'
                  }`}
                >
                  <List size={15} />
                </button>
              </div>
            </div>
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
        ) : viewMode === 'grid' ? (
          <div className="mt-px grid gap-px border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((l) => (
              <Link
                key={l.id}
                href={`/marketplace/${l.id}`}
                className="group flex flex-col justify-between bg-white p-6 transition-colors hover:bg-neutral-950 hover:text-white"
              >
                <div>
                  <div className="relative mb-4 aspect-16/10 w-full overflow-hidden border border-neutral-200 bg-neutral-100 transition-colors group-hover:border-neutral-800 group-hover:bg-neutral-900">
                    {l.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={l.imageUrl}
                        alt={l.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-display text-[28px] font-bold text-neutral-300 group-hover:text-neutral-700">
                        {l.category.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="mono absolute left-2 top-2 bg-neutral-950/80 px-2 py-0.5 text-[10px] font-semibold tracking-widest text-white backdrop-blur-xs">
                      {l.kind}
                    </span>
                  </div>

                  <p className="mono text-[10.5px] tracking-[0.2em] opacity-60">
                    {l.category.toUpperCase()}
                  </p>
                  <h3 className="mt-2 text-[18px] font-semibold leading-snug tracking-tight">
                    {l.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-[13px] text-neutral-500 transition-colors group-hover:text-neutral-400">
                    {l.description}
                  </p>
                </div>

                <div className="mt-6 border-t border-current/10 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="mono text-[11.5px] tracking-widest opacity-60">
                      @{l.seller?.username ?? 'seller'}
                      {l.seller?.emailVerified ? ' ✓' : ''}
                    </span>
                    <span className="mono text-[11px] opacity-60">
                      {l.salesCount} sale{l.salesCount === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="mono text-[20px] font-semibold tabular-nums">
                      {formatNGN(l.priceKobo)}
                    </p>
                    <span className="flex items-center gap-1 text-[12px] font-medium opacity-0 transition-opacity group-hover:opacity-100">
                      View <ArrowUpRight size={13} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <ol className="mt-px divide-y divide-neutral-200 border border-t-0 border-neutral-200 bg-white">
            {items.map((l, i) => (
              <li key={l.id}>
                <button
                  onClick={() => router.push(`/marketplace/${l.id}`)}
                  className="group grid w-full cursor-pointer grid-cols-[auto_auto_1fr_auto] items-center gap-4 px-5 py-5 text-left transition-colors hover:bg-neutral-950 hover:text-white md:gap-6 md:px-8"
                >
                  <span className="mono text-[12px] tracking-widest text-neutral-300 transition-colors group-hover:text-neutral-500">
                    {String((page - 1) * 9 + i + 1).padStart(2, '0')}
                  </span>
                  <div className="relative hidden h-14 w-18 shrink-0 overflow-hidden border border-neutral-200 bg-neutral-100 sm:block">
                    {l.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-display text-[14px] font-bold text-neutral-400">
                        {l.category.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="min-w-0">
                    <span className="mono block text-[10.5px] tracking-[0.2em] text-neutral-400 transition-colors group-hover:text-neutral-400">
                      {l.category.toUpperCase()} · {l.kind} · {l.salesCount} SALE{l.salesCount === 1 ? '' : 'S'}
                    </span>
                    <span className="mt-1 block truncate font-display text-[18px] font-bold leading-tight tracking-tight md:text-[22px]">
                      {l.title}
                    </span>
                    <span className="mt-1 hidden truncate text-[13px] text-neutral-500 transition-colors group-hover:text-neutral-400 md:block">
                      {l.description}
                    </span>
                    <span className="mono mt-1 block text-[11.5px] tracking-widest text-neutral-500 transition-colors group-hover:text-neutral-400">
                      @{l.seller?.username ?? 'seller'}
                      {l.seller?.emailVerified ? ' ✓' : ''}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="mono text-[18px] font-semibold tabular-nums md:text-[20px]">
                      {formatNGN(l.priceKobo)}
                    </span>
                    <span className="flex items-center gap-1 text-[12px] font-medium opacity-0 transition-opacity group-hover:opacity-100">
                      View <ArrowUpRight size={13} />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )}

        {/* Pagination */}
        {!loading && items.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="mono text-[11.5px] tracking-widest text-neutral-400">
              PAGE {page} OF {pages} — {total} TOTAL LISTINGS
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
        )}

        {/* Escrow reassurance */}
        <div className="mt-12 grid gap-px border border-neutral-200 bg-neutral-200 md:grid-cols-3">
          {[
            ['01 — Fund Escrow', 'Buyer funds are held safely with our payment partner.'],
            ['02 — Delivery Flow', 'Seller delivers files or service through the deal room.'],
            ['03 — Safe Release', 'Payment releases to seller only when buyer verifies and accepts.'],
          ].map(([t, s]) => (
            <div key={t} className="flex items-center gap-3 bg-white px-5 py-4">
              <ShieldCheck size={18} className="shrink-0 text-neutral-950" />
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
