'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SiteNav } from '@/components/site-nav';
import { ListingForm, type ListingFormValues } from '@/components/listing-form';
import { useAuth } from '@/lib/auth-context';
import { api, type ApiListing } from '@/lib/api';

const DEFAULT_CATS = ['Software', 'Template', 'Course', 'Audio', 'Design Asset', 'Ebook', 'Service', 'Other'];

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [listing, setListing] = useState<ApiListing | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push(`/login?next=/marketplace/${id}/edit`);
    else if (user)
      api
        .listing(id)
        .then((l) => {
          if (l.sellerId !== user.id) router.push(`/marketplace/${id}`);
          else setListing(l);
        })
        .catch(() => router.push('/marketplace'));
  }, [user, loading, id, router]);

  if (loading || !user || !listing) {
    return (
      <div className="mono flex min-h-screen items-center justify-center bg-[#fafafa] text-[12px] tracking-widest text-neutral-500">
        LOADING…
      </div>
    );
  }

  async function submit(v: ListingFormValues) {
    setError(null);
    setSaving(true);
    try {
      await api.updateListing(id, {
        title: v.title.trim(),
        description: v.description.trim(),
        priceNaira: Number(v.priceNaira),
        category: v.category,
        imageUrl: v.imageUrl.trim() || undefined,
        status: v.status,
      });
      router.push(`/marketplace/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save listing.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-950">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28 md:px-8">
        <p className="eyebrow text-neutral-500">SELL — EDIT LISTING</p>
        <h1 className="mt-3 font-display text-[36px] font-bold leading-none tracking-tight md:text-[48px]">
          Edit listing.
        </h1>
        <div className="mt-8 border border-neutral-200 bg-white p-6 md:p-8">
          <ListingForm
            initial={{
              title: listing.title,
              description: listing.description,
              priceNaira: String(Math.round(Number(listing.priceKobo) / 100)),
              kind: listing.kind,
              category: listing.category,
              imageUrl: listing.imageUrl ?? '',
              status: listing.status,
            }}
            categories={DEFAULT_CATS}
            submitLabel="Save changes"
            saving={saving}
            error={error}
            showStatus
            onSubmit={submit}
          />
        </div>
      </main>
    </div>
  );
}
