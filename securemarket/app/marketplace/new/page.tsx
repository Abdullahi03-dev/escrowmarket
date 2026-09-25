'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SiteNav } from '@/components/site-nav';
import { ListingForm, type ListingFormValues } from '@/components/listing-form';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

const DEFAULT_CATS = ['Software', 'Template', 'Course', 'Audio', 'Design Asset', 'Ebook', 'Service', 'Other'];

export default function NewListingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login?next=/marketplace/new');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="mono flex min-h-screen items-center justify-center bg-[#fafafa] text-[12px] tracking-widest text-neutral-500">
        LOADING…
      </div>
    );
  }

  const canSell = user.role === 'SELLER' || user.role === 'BOTH' || user.role === 'ADMIN';

  async function submit(v: ListingFormValues) {
    setError(null);
    setSaving(true);
    try {
      const listing = await api.createListing({
        title: v.title.trim(),
        description: v.description.trim(),
        priceNaira: Number(v.priceNaira),
        kind: v.kind,
        category: v.category,
        imageUrl: v.imageUrl.trim() || undefined,
      });
      router.push(`/marketplace/${listing.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create listing.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-950">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28 md:px-8">
        <p className="eyebrow text-neutral-500">SELL — NEW LISTING</p>
        <h1 className="mt-3 font-display text-[36px] font-bold leading-none tracking-tight md:text-[48px]">
          List your work.
        </h1>
        <p className="mt-3 max-w-lg text-[14.5px] leading-6 text-neutral-600">
          Buyers fund escrow before you deliver — describe exactly what they get.
        </p>

        {!canSell ? (
          <div className="mt-8 border border-neutral-950 bg-white p-6">
            <p className="text-[15px] font-semibold">Your account is buyer-only.</p>
            <p className="mt-1.5 text-[13.5px] leading-6 text-neutral-600">
              Switch your role to Seller or Both to list products and services.
            </p>
            <Link href="/onboarding" className="mt-4 inline-block bg-neutral-950 px-5 py-2.5 text-[13px] font-medium text-white">
              Update my role →
            </Link>
          </div>
        ) : (
          <div className="mt-8 border border-neutral-200 bg-white p-6 md:p-8">
            <ListingForm
              initial={{ title: '', description: '', priceNaira: '', kind: 'PRODUCT', category: 'Software', imageUrl: '' }}
              categories={DEFAULT_CATS}
              submitLabel="Publish listing"
              saving={saving}
              error={error}
              onSubmit={submit}
            />
          </div>
        )}
      </main>
    </div>
  );
}
