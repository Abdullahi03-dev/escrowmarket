'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, BadgeCheck, Pencil, ShieldCheck, Trash2 } from 'lucide-react';
import { SiteNav } from '@/components/site-nav';
import { SiteFooter } from '@/components/site-footer';
import { useAuth } from '@/lib/auth-context';
import { api, type ApiListing } from '@/lib/api';
import { formatNGN } from '@/lib/format';

export function stars(avg: number | null) {
  if (avg == null) return 'No ratings yet';
  const full = Math.round(avg);
  return `${'★'.repeat(full)}${'☆'.repeat(5 - full)} ${avg.toFixed(1)}`;
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [listing, setListing] = useState<ApiListing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [rating, setRating] = useState<{ avg: number | null; count: number } | null>(null);

  const load = useCallback(async () => {
    try {
      const l = await api.listing(id);
      setListing(l);
      if (l.seller?.username) {
        api.reviewsForUser(l.seller.username)
          .then((r) => setRating({ avg: r.avg, count: r.count }))
          .catch(() => setRating(null));
      }
    } catch {
      setError('Listing not found.');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function buy() {
    if (buying) return;
    if (!user) {
      router.push(`/login?next=/marketplace/${id}`);
      return;
    }
    setBuyError(null);
    setBuying(true);
    try {
      const tx = await api.createTransaction(id);
      router.push(`/transactions/${tx.id}`);
    } catch (err) {
      setBuyError(err instanceof Error ? err.message : 'Could not start transaction.');
    } finally {
      setBuying(false);
    }
  }

  async function archive() {
    if (!listing || !confirm('Archive this listing? It will disappear from the marketplace.')) return;
    try {
      await api.archiveListing(listing.id);
      router.push('/marketplace');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not archive.');
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fafafa] text-neutral-950">
        <SiteNav />
        <main className="mx-auto max-w-3xl px-5 pb-24 pt-32 text-center">
          <p className="font-display text-[28px] font-bold">{error}</p>
          <Link href="/marketplace" className="mt-4 inline-block underline underline-offset-4">← Back to marketplace</Link>
        </main>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mono flex min-h-screen items-center justify-center bg-[#fafafa] text-[12px] tracking-widest text-neutral-500">
        LOADING…
      </div>
    );
  }

  const isOwner = user?.id === listing.sellerId;

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-950">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-5 pb-24 pt-28 md:px-8">
        <Link href="/marketplace" className="flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 hover:text-black">
          <ArrowLeft size={15} /> Marketplace
        </Link>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="border border-neutral-200 bg-white p-7 md:p-10">
            <p className="mono text-[11px] tracking-[0.2em] text-neutral-500">
              {listing.category.toUpperCase()} — {listing.kind}
            </p>
            <h1 className="mt-3 font-display text-[34px] font-bold leading-[1.02] tracking-tight md:text-[48px]">
              {listing.title}
            </h1>
            <p className="mono mt-3 text-[12px] tracking-widest text-neutral-500">
              {listing.salesCount} SALE{listing.salesCount === 1 ? '' : 'S'} — LISTED {new Date(listing.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
            </p>
            <div className="my-6 h-px bg-neutral-200" />
            <p className="whitespace-pre-line text-[15px] leading-7 text-neutral-700">{listing.description}</p>

            {isOwner && (
              <div className="mt-8 flex flex-wrap gap-2 border-t border-neutral-200 pt-6">
                <span className="mono border border-neutral-300 px-2 py-1 text-[10.5px] tracking-widest text-neutral-500">
                  STATUS — {listing.status}
                </span>
                <Link href={`/marketplace/${listing.id}/edit`} className="flex items-center gap-1.5 border border-neutral-950 px-4 py-2 text-[13px] font-medium transition-colors hover:bg-neutral-950 hover:text-white">
                  <Pencil size={14} /> Edit
                </Link>
                {listing.status !== 'ARCHIVED' && (
                  <button onClick={archive} className="flex cursor-pointer items-center gap-1.5 border border-neutral-300 px-4 py-2 text-[13px] font-medium text-neutral-600 transition-colors hover:border-neutral-950 hover:text-black">
                    <Trash2 size={14} /> Archive
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="border border-neutral-950 bg-white p-6 shadow-[8px_8px_0_0_#0a0a0a]">
              <p className="mono text-[11px] tracking-[0.2em] text-neutral-500">PRICE — {listing.currency}</p>
              <p className="mono mt-1 text-[36px] font-semibold tabular-nums">{formatNGN(listing.priceKobo)}</p>
              {buyError && (
                <p className="mt-3 bg-neutral-950 px-3 py-2 text-[12.5px] leading-5 text-white">{buyError}</p>
              )}
              {!isOwner && listing.status === 'ACTIVE' && (
                <button
                  onClick={buy}
                  disabled={buying}
                  className="mt-4 w-full cursor-pointer bg-neutral-950 py-3.5 text-[14px] font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
                >
                  {buying ? 'Starting transaction…' : 'Buy — fund escrow'}
                </button>
              )}
              {!isOwner && listing.status !== 'ACTIVE' && (
                <p className="mono mt-4 border border-neutral-300 px-3 py-2.5 text-center text-[11.5px] tracking-widest text-neutral-500">
                  NOT AVAILABLE
                </p>
              )}
              <div className="mt-4 flex items-start gap-2.5 border-t border-neutral-200 pt-4">
                <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                <p className="text-[12.5px] leading-5 text-neutral-600">
                  Payment is held in escrow and released only when you accept delivery.
                </p>
              </div>
            </div>

            <div className="border border-neutral-200 bg-white p-6">
              <p className="mono text-[11px] tracking-[0.2em] text-neutral-500">SELLER</p>
              <p className="mt-2 flex items-center gap-1.5 text-[16px] font-semibold">
                {listing.seller?.name ?? 'Seller'}
                {listing.seller?.emailVerified && <BadgeCheck size={16} />}
              </p>
              <p className="mono mt-0.5 text-[12px] tracking-widest text-neutral-500">@{listing.seller?.username}</p>
              {rating && rating.count > 0 && (
                <p className="mt-1.5 text-[13px] font-medium tracking-wide">
                  {stars(rating.avg)} <span className="font-normal text-neutral-500">({rating.count} review{rating.count === 1 ? '' : 's'})</span>
                </p>
              )}
              {listing.seller?.bio && (
                <p className="mt-2.5 text-[13.5px] leading-6 text-neutral-600">{listing.seller.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* How buying works — plain language */}
        <div className="mt-10 border border-neutral-950 bg-white">
          <p className="mono border-b border-neutral-200 px-6 py-3.5 text-[11px] tracking-[0.2em] text-neutral-500">
            HOW BUYING WORKS — YOUR MONEY STAYS SAFE
          </p>
          <div className="grid md:grid-cols-3">
            {[
              ['1. You fund escrow', 'Pay now — money is held, not sent to the seller.'],
              ['2. Seller delivers', 'They submit the work through the deal page.'],
              ['3. You accept', 'Happy? Accept and the money is released. If not, chat or report a problem.'],
            ].map(([t, s], i) => (
              <div key={t} className={`px-6 py-5 ${i > 0 ? 'border-t border-neutral-200 md:border-l md:border-t-0' : ''}`}>
                <p className="text-[14px] font-semibold">{t}</p>
                <p className="mt-1 text-[13px] leading-6 text-neutral-600">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
