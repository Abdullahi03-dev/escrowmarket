'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, type ApiListing } from '@/lib/api';
import { formatNGN } from '@/lib/format';

export function MarketplacePreview() {
  const [items, setItems] = useState<ApiListing[] | null>(null);

  useEffect(() => {
    api
      .listings({ limit: 4 })
      .then((res) => setItems(res.items))
      .catch(() => setItems([]));
  }, []);

  if (items === null) {
    return (
      <p className="mono mt-12 border border-neutral-200 bg-white py-10 text-center text-[12px] tracking-widest text-neutral-400">
        LOADING LISTINGS…
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-12 border border-neutral-200 bg-white px-6 py-12 text-center">
        <p className="font-display text-[22px] font-bold">The shelves are empty — for now.</p>
        <p className="mx-auto mt-2 max-w-sm text-[13.5px] text-neutral-600">
          Be the first seller. List a product or service in under two minutes.
        </p>
        <Link href="/marketplace/new" className="mt-5 inline-block bg-neutral-950 px-6 py-3 text-[13.5px] font-medium text-white">
          Start selling →
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-12 grid gap-px border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((l) => (
        <Link
          key={l.id}
          href={`/marketplace/${l.id}`}
          className="group flex flex-col justify-between bg-white p-5 transition-colors hover:bg-neutral-950 hover:text-white"
        >
          <div>
            {/* Visual thumbnail or brutalist monogram banner */}
            <div className="relative mb-4 aspect-16/10 w-full overflow-hidden border border-neutral-200 bg-neutral-100 transition-colors group-hover:border-neutral-800 group-hover:bg-neutral-900">
              {l.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={l.imageUrl}
                  alt={l.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    // Hide broken image link gracefully
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-display text-[26px] font-bold text-neutral-300 group-hover:text-neutral-700">
                  {l.category.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="mono absolute left-2 top-2 bg-neutral-950/80 px-1.5 py-0.5 text-[9.5px] font-semibold tracking-widest text-white backdrop-blur-xs">
                {l.kind}
              </span>
            </div>

            <p className="mono text-[10px] tracking-[0.2em] opacity-60">
              {l.category.toUpperCase()}
            </p>
            <h3 className="mt-2 line-clamp-2 text-[16px] font-semibold leading-snug tracking-tight">
              {l.title}
            </h3>
          </div>

          <div className="mt-5 border-t border-current/10 pt-3">
            <div className="flex items-center justify-between">
              <span className="mono text-[11px] tracking-widest opacity-60">
                @{l.seller?.username ?? 'seller'}
                {l.seller?.emailVerified ? ' ✓' : ''}
              </span>
              <span className="mono text-[10px] opacity-60">
                {l.salesCount} sold
              </span>
            </div>
            <p className="mono mt-2 text-[18px] font-semibold tabular-nums">
              {formatNGN(l.priceKobo)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
