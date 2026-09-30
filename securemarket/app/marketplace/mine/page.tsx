'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Pencil, Plus } from 'lucide-react';
import { SiteNav } from '@/components/site-nav';
import { SiteFooter } from '@/components/site-footer';
import { useAuth } from '@/lib/auth-context';
import { api, type ApiListing } from '@/lib/api';
import { formatNGN } from '@/lib/format';

export default function MyListingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ApiListing[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await api.myListings());
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) router.push('/login?next=/marketplace/mine');
    if (user) load();
  }, [user, loading, router, load]);

  if (loading || !user) {
    return (
      <div className="mono flex min-h-screen items-center justify-center bg-[#fafafa] text-[12px] tracking-widest text-neutral-500">
        LOADING…
      </div>
    );
  }

  async function setStatus(id: string, status: string) {
    if (busy) return;
    setBusy(id);
    try {
      setItems((list) => (list ?? []).map((l) => (l.id === id ? { ...l, status: status as ApiListing['status'] } : l)));
      await api.updateListing(id, { status });
    } catch {
      load();
    } finally {
      setBusy(null);
    }
  }

  const [archiveTarget, setArchiveTarget] = useState<ApiListing | null>(null);

  async function handleArchiveConfirm() {
    if (!archiveTarget || busy) return;
    setBusy(archiveTarget.id);
    try {
      await api.archiveListing(archiveTarget.id);
      setArchiveTarget(null);
      load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-950">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-28 md:px-8">
        <Link href="/marketplace" className="flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 hover:text-black">
          <ArrowLeft size={15} /> Marketplace
        </Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-neutral-500">SELL — MY LISTINGS</p>
            <h1 className="mt-3 font-display text-[36px] font-bold leading-none tracking-tight md:text-[48px]">
              Your shop.
            </h1>
          </div>
          <Link
            href="/marketplace/new"
            className="flex items-center gap-2 bg-neutral-950 px-5 py-3 text-[13.5px] font-medium text-white transition-colors hover:bg-neutral-800"
          >
            <Plus size={16} /> New listing
          </Link>
        </div>

        {items === null ? (
          <p className="mono mt-8 border border-neutral-200 bg-white py-12 text-center text-[12px] tracking-widest text-neutral-400">
            LOADING…
          </p>
        ) : items.length === 0 ? (
          <div className="mt-8 border border-neutral-200 bg-white px-6 py-16 text-center">
            <p className="font-display text-[24px] font-bold">Nothing listed yet.</p>
            <p className="mx-auto mt-2 max-w-sm text-[13.5px] text-neutral-600">
              Publish your first product or service — buyers fund escrow before you deliver.
            </p>
            <Link href="/marketplace/new" className="mt-5 inline-block bg-neutral-950 px-6 py-3 text-[13.5px] font-medium text-white">
              List your work →
            </Link>
          </div>
        ) : (
          <div className="mt-8 divide-y divide-neutral-200 border border-neutral-200 bg-white">
            {items.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-6">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="relative h-12 w-16 shrink-0 overflow-hidden border border-neutral-200 bg-neutral-100">
                    {l.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-display text-[12px] font-bold text-neutral-400">
                        {l.category.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <button onClick={() => router.push(`/marketplace/${l.id}`)} className="min-w-0 flex-1 cursor-pointer text-left">
                    <p className="truncate text-[15px] font-semibold hover:underline">{l.title}</p>
                    <p className="mono mt-0.5 text-[11px] tracking-widest text-neutral-500">
                      {formatNGN(l.priceKobo)} — {l.kind} — {l.salesCount} SALE{l.salesCount === 1 ? '' : 'S'}
                    </p>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`mono px-2 py-0.5 text-[10.5px] tracking-widest ${l.status === 'ACTIVE' ? 'bg-neutral-950 text-white' : 'border border-neutral-300 text-neutral-500'}`}>
                    {l.status}
                  </span>
                  <div className="flex gap-2">
                    <Link
                      href={`/marketplace/${l.id}/edit`}
                      className="flex items-center gap-1 border border-neutral-300 px-3 py-1.5 text-[12.5px] font-medium transition-colors hover:border-neutral-950"
                    >
                      <Pencil size={13} /> Edit
                    </Link>
                    {l.status === 'ACTIVE' ? (
                      <button
                        onClick={() => setStatus(l.id, 'PAUSED')}
                        disabled={busy === l.id}
                        className="cursor-pointer border border-neutral-300 px-3 py-1.5 text-[12.5px] font-medium transition-colors hover:border-neutral-950 disabled:opacity-50"
                      >
                        Pause
                      </button>
                    ) : l.status === 'PAUSED' ? (
                      <button
                        onClick={() => setStatus(l.id, 'ACTIVE')}
                        disabled={busy === l.id}
                        className="cursor-pointer border border-neutral-950 px-3 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-neutral-950 hover:text-white disabled:opacity-50"
                      >
                        Resume
                      </button>
                    ) : null}
                    {l.status !== 'ARCHIVED' && (
                      <button
                        onClick={() => setArchiveTarget(l)}
                        disabled={busy === l.id}
                        className="cursor-pointer border border-neutral-300 px-3 py-1.5 text-[12.5px] font-medium text-neutral-500 transition-colors hover:border-neutral-950 hover:text-black disabled:opacity-50"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom Confirmation Modal */}
        {archiveTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md border border-neutral-950 bg-white p-6 shadow-2xl">
              <p className="eyebrow text-neutral-500">CONFIRM ARCHIVE</p>
              <h3 className="mt-2 font-display text-[20px] font-bold">Archive &quot;{archiveTarget.title}&quot;?</h3>
              <p className="mt-2 text-[13.5px] leading-6 text-neutral-600">
                This listing will be hidden from the public marketplace. Existing transactions and history will be preserved.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setArchiveTarget(null)}
                  className="cursor-pointer border border-neutral-300 px-4 py-2 text-[13px] font-medium hover:border-neutral-950"
                >
                  Cancel
                </button>
                <button
                  onClick={handleArchiveConfirm}
                  disabled={busy !== null}
                  className="cursor-pointer bg-neutral-950 px-5 py-2 text-[13px] font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
                >
                  {busy ? 'Archiving…' : 'Yes, archive'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
