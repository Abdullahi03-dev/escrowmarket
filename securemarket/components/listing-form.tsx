'use client';

import { useState } from 'react';

export type ListingFormValues = {
  title: string;
  description: string;
  priceNaira: string;
  kind: string;
  category: string;
  imageUrl: string;
  status?: string;
};

export function ListingForm({
  initial,
  categories,
  submitLabel,
  saving,
  error,
  showStatus,
  onSubmit,
}: {
  initial: ListingFormValues;
  categories: string[];
  submitLabel: string;
  saving: boolean;
  error: string | null;
  showStatus?: boolean;
  onSubmit: (v: ListingFormValues) => void;
}) {
  const [v, setV] = useState(initial);
  const set = (k: keyof ListingFormValues, val: string) => setV((s) => ({ ...s, [k]: val }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!saving) onSubmit(v);
      }}
      className="space-y-4"
    >
      {error && (
        <p className="border border-neutral-950 bg-neutral-950 px-3.5 py-2.5 text-[13px] leading-5 text-white">
          {error}
        </p>
      )}
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium">Title</span>
        <input required minLength={4} maxLength={140} value={v.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Python for Fintech" className="w-full border border-neutral-300 bg-white px-3.5 py-2.5 text-[14.5px] outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950" />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium">Type</span>
          <select value={v.kind} onChange={(e) => set('kind', e.target.value)} className="w-full cursor-pointer border border-neutral-300 bg-white px-3.5 py-2.5 text-[14.5px] outline-none focus:border-neutral-950">
            <option value="PRODUCT">Digital product (files/links)</option>
            <option value="SERVICE">Service (custom work)</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium">Category</span>
          <select value={v.category} onChange={(e) => set('category', e.target.value)} className="w-full cursor-pointer border border-neutral-300 bg-white px-3.5 py-2.5 text-[14.5px] outline-none focus:border-neutral-950">
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium">Price (₦)</span>
          <input required inputMode="numeric" pattern="[0-9]+" minLength={3} value={v.priceNaira} onChange={(e) => set('priceNaira', e.target.value.replace(/[^0-9]/g, ''))} placeholder="25000" className="mono w-full border border-neutral-300 bg-white px-3.5 py-2.5 text-[14.5px] outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950" />
        </label>
      </div>

      {v.priceNaira && Number(v.priceNaira) > 0 && (
        <div className="flex items-center justify-between border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-[12.5px] text-neutral-600">
          <span>Buyer funds: <span className="mono font-semibold text-neutral-950">₦{Number(v.priceNaira).toLocaleString()}</span></span>
          <span>You receive: <span className="mono font-semibold text-neutral-950">₦{Number(v.priceNaira).toLocaleString()}</span> (0% fee)</span>
        </div>
      )}

      <label className="block">
        <span className="mb-1.5 flex items-baseline justify-between text-[13px] font-medium">
          <span>Description & Terms</span>
          <span className="text-[12px] font-normal text-neutral-500">Min. 20 chars</span>
        </span>
        <textarea required minLength={20} maxLength={5000} rows={5} value={v.description} onChange={(e) => set('description', e.target.value)} placeholder={v.kind === 'PRODUCT' ? 'What format are the files? How do buyers receive updates? What is included?' : 'What is the scope of work? How many revisions are included? Estimated completion time?'} className="w-full border border-neutral-300 bg-white px-3.5 py-2.5 text-[14.5px] leading-6 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950" />
      </label>

      <div>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium">Cover image URL <span className="font-normal text-neutral-400">— optional</span></span>
          <input value={v.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://images.unsplash.com/…" inputMode="url" className="w-full border border-neutral-300 bg-white px-3.5 py-2.5 text-[14.5px] outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950" />
        </label>

        {v.imageUrl && (
          <div className="mt-2.5 flex items-center gap-3 border border-neutral-200 bg-neutral-50 p-2">
            <div className="relative h-12 w-20 overflow-hidden border border-neutral-300 bg-neutral-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.imageUrl} alt="Cover preview" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLElement).style.opacity = '0.3'; }} />
            </div>
            <p className="text-[12px] text-neutral-500">Preview: Cover image loaded.</p>
          </div>
        )}
      </div>

      {showStatus && (
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium">Listing Status</span>
          <select value={v.status} onChange={(e) => set('status', e.target.value)} className="w-full cursor-pointer border border-neutral-300 bg-white px-3.5 py-2.5 text-[14.5px] outline-none focus:border-neutral-950">
            <option value="ACTIVE">Active — visible in marketplace</option>
            <option value="PAUSED">Paused — temporarily hidden from marketplace</option>
            <option value="ARCHIVED">Archived — permanently hidden</option>
          </select>
        </label>
      )}

      <button type="submit" disabled={saving} className="w-full cursor-pointer bg-neutral-950 py-3 text-[14px] font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60">
        {saving ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
