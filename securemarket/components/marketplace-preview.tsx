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
        <Link key={l.id} href={`/marketplace/${l.id}`} className="group bg-white p-6 transition-colors hover:bg-neutral-950 hover:text-white">
          <p className="mono text-[10px] tracking-[0.2em] opacity-60">{l.category.toUpperCase()} — {l.kind}</p>
          <h3 className="mt-3 min-h-[48px] text-[16px] font-semibold leading-snug tracking-tight">
            {l.title}
          </h3>
          <p className="mono mt-3 text-[11px] tracking-widest opacity-60">
            @{l.seller?.username ?? 'seller'} — {l.salesCount} SALE{l.salesCount === 1 ? '' : 'S'}
          </p>
          <p className="mono mt-4 border-t border-current/10 pt-4 text-[18px] font-semibold tabular-nums">
            {formatNGN(l.priceKobo)}
          </p>
        </Link>
      ))}
    </div>
  );
}
