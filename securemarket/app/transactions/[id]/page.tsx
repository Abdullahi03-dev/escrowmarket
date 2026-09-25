'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { ArrowLeft, FlaskConical, ShieldCheck } from 'lucide-react';
import { SiteNav } from '@/components/site-nav';
import { SiteFooter } from '@/components/site-footer';
import { useAuth } from '@/lib/auth-context';
import { api, type ApiChatMessage, type ApiPayout, type ApiReview, type ApiTransaction } from '@/lib/api';
import { formatNGN } from '@/lib/format';

const STEPS = ['AGREEMENT', 'SECURED', 'DELIVERED', 'COMPLETED'] as const;
const STEP_LABEL: Record<string, string> = {
  AGREEMENT: 'AGREEMENT CREATED',
  SECURED: 'PAYMENT SECURED',
  DELIVERED: 'DELIVERY SUBMITTED',
  COMPLETED: 'COMPLETED',
};
// Plain-language helper under each step — the UI fix for "too technical".
const STEP_HELP: Record<string, string> = {
  AGREEMENT: 'You both agree on what will be delivered.',
  SECURED: 'Buyer has paid. Money is held safely — not with the seller yet.',
  DELIVERED: 'Seller has sent the work. Buyer should review it.',
  COMPLETED: 'Buyer accepted. Deal is done.',
};

function StatusPill({ status }: { status: string }) {
  const dark = status === 'SECURED' || status === 'COMPLETED';
  return (
    <span
      className={`mono px-2.5 py-1 text-[11px] tracking-[0.18em] ${
        dark ? 'bg-neutral-950 text-white' : 'border border-neutral-950'
      }`}
    >
      ● {status}
    </span>
  );
}

function nextActionText(tx: ApiTransaction, isBuyer: boolean, isSeller: boolean): string {
  if (tx.status === 'AGREEMENT') {
    if (isBuyer) return 'Your turn — pay now. Your money stays held safely until you accept the work.';
    if (isSeller) return 'Waiting on the buyer to pay. You deliver only after payment is secured.';
    return 'Agreement open — waiting on the buyer to fund escrow.';
  }
  if (tx.status === 'SECURED') {
    if (isSeller) return 'Money is secured. Your turn — deliver the work below.';
    return 'Paid and secured. The seller is preparing your delivery. Chat below if needed.';
  }
  if (tx.status === 'DELIVERED') {
    if (isBuyer) return 'Seller delivered. Review it — accept to release the money, or open a dispute.';
    return 'Delivered. Waiting on the buyer to accept and release the money.';
  }
  if (tx.status === 'COMPLETED') return 'Done. Buyer accepted — money is released to the seller.';
  if (tx.status === 'DISPUTED') return 'Paused — under review. Money stays locked. Keep talking in the chat.';
  if (tx.status === 'REFUNDED') return 'Resolved — money went back to the buyer. Deal closed.';
  return 'Cancelled before payment. No money moved.';
}

function TxRoom() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const [tx, setTx] = useState<ApiTransaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [deliverNote, setDeliverNote] = useState('');
  const [deliverUrl, setDeliverUrl] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [showDispute, setShowDispute] = useState(false);
  const [chat, setChat] = useState<ApiChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [payout, setPayout] = useState<ApiPayout | null>(null);
  const [reviews, setReviews] = useState<ApiReview[] | null>(null);
  const [ratingSel, setRatingSel] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setTx(await api.transaction(id));
    } catch {
      setError('Transaction not found or not yours.');
    }
  }, [id]);

  const loadChat = useCallback(async () => {
    try {
      setChat(await api.chatMessages(id));
    } catch {
      /* chat is optional — ledger still shows */
    }
  }, [id]);

  useEffect(() => {
    load();
    loadChat();
  }, [load, loadChat]);

  // Payout status once the deal completes.
  useEffect(() => {
    if (tx?.status === 'COMPLETED') {
      api.payoutForTransaction(id).then(setPayout).catch(() => setPayout(null));
      api.reviewsForTransaction(id).then(setReviews).catch(() => setReviews([]));
    }
  }, [id, tx?.status]);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (reviewBusy || !tx) return;
    setReviewBusy(true);
    setActionError(null);
    try {
      const r = await api.createReview(tx.id, ratingSel, reviewComment.trim() || undefined);
      setReviews((list) => [...(list ?? []), { ...r, mine: true }]);
      setReviewComment('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not save review.');
    } finally {
      setReviewBusy(false);
    }
  }

  // Gentle polling so both sides see new messages without refresh.
  useEffect(() => {
    const t = setInterval(loadChat, 8000);
    return () => clearInterval(t);
  }, [loadChat]);

  // Paystack redirect back (?reference=... or ?trxref=...) — confirm funding.
  useEffect(() => {
    const ref = search.get('reference') ?? search.get('trxref');
    if (!ref || !tx || tx.status !== 'AGREEMENT') return;
    setBusy('verify');
    setActionError(null);
    api
      .verifyTransactionPayment(tx.id, ref)
      .then((updated) => {
        setTx(updated);
        router.replace(`/transactions/${tx.id}`);
      })
      .catch((err) => setActionError(err instanceof Error ? err.message : 'Payment not confirmed yet.'))
      .finally(() => setBusy(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tx?.id]);

  async function run(key: string, fn: () => Promise<ApiTransaction>) {
    if (busy) return;
    setActionError(null);
    setBusy(key);
    try {
      setTx(await fn());
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusy(null);
    }
  }

  async function fund() {
    if (busy) return;
    setActionError(null);
    setBusy('fund');
    try {
      const res = await api.fundTransaction(id);
      if (res.authorizationUrl) {
        window.location.href = res.authorizationUrl;
        return;
      }
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Funding failed.');
    } finally {
      setBusy(null);
    }
  }

  // "I already paid" — re-verify with the stored reference (tab was closed, etc).
  async function retryVerify() {
    const ref = tx?.paymentReference ?? search.get('reference') ?? search.get('trxref');
    if (!ref || !tx) {
      setActionError('No payment reference yet — click Fund escrow first.');
      return;
    }
    setBusy('verify');
    setActionError(null);
    try {
      setTx(await api.verifyTransactionPayment(tx.id, ref));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Payment not confirmed yet.');
    } finally {
      setBusy(null);
    }
  }

  async function sendChat(e: React.FormEvent) {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || chatBusy) return;
    setChatBusy(true);
    try {
      const msg = await api.sendChatMessage(id, text);
      setChat((c) => [...c, msg]);
      setChatInput('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not send message.');
    } finally {
      setChatBusy(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fafafa] text-neutral-950">
        <SiteNav />
        <main className="mx-auto max-w-3xl px-5 pb-24 pt-32 text-center">
          <p className="font-display text-[28px] font-bold">{error}</p>
          <Link href="/dashboard" className="mt-4 inline-block underline underline-offset-4">← Back to dashboard</Link>
        </main>
      </div>
    );
  }

  if (!tx || !user) {
    return (
      <div className="mono flex min-h-screen items-center justify-center bg-[#fafafa] text-[12px] tracking-widest text-neutral-500">
        LOADING…
      </div>
    );
  }

  const isBuyer = user.id === tx.buyerId;
  const isSeller = user.id === tx.sellerId;
  const stepIndex = STEPS.indexOf(tx.status as (typeof STEPS)[number]);
  const terminal = tx.status === 'DISPUTED' || tx.status === 'CANCELLED' || tx.status === 'REFUNDED';
  const otherName = isBuyer ? tx.seller?.name ?? 'Seller' : tx.buyer?.name ?? 'Buyer';

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-950">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-5 pb-24 pt-28 md:px-8">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 hover:text-black">
          <ArrowLeft size={15} /> Dashboard
        </Link>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-neutral-500">TRANSACTION — {tx.code}</p>
            <h1 className="mt-2 font-display max-w-2xl text-[32px] font-bold leading-[1.02] tracking-tight md:text-[44px]">
              {tx.listingTitle}
            </h1>
            <p className="mt-2 max-w-xl text-[14px] leading-6 text-neutral-600">{nextActionText(tx, isBuyer, isSeller)}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusPill status={tx.status} />
            {tx.fundedVia === 'test' && (
              <span className="mono flex items-center gap-1.5 border border-dashed border-neutral-400 px-2 py-1 text-[10.5px] tracking-widest text-neutral-500">
                <FlaskConical size={12} /> TEST MODE — NO REAL MONEY
              </span>
            )}
          </div>
        </div>

        {actionError && (
          <p className="mt-5 border border-neutral-950 bg-neutral-950 px-4 py-3 text-[13px] leading-5 text-white">
            {actionError}
          </p>
        )}

        {/* Simple 4-step strip */}
        <div className="mt-6 grid gap-px border border-neutral-200 bg-neutral-200 sm:grid-cols-4">
          {STEPS.map((s, i) => {
            const done = !terminal && stepIndex >= i;
            const current = !terminal && stepIndex === i;
            return (
              <div key={s} className={`bg-white px-4 py-3.5 ${current ? 'outline outline-2 -outline-offset-2 outline-neutral-950' : ''}`}>
                <p className={`mono text-[11px] tracking-[0.16em] ${done ? '' : 'text-neutral-400'}`}>
                  {i + 1}. {STEP_LABEL[s]}
                </p>
                <p className="mt-1 text-[12.5px] leading-5 text-neutral-600">{STEP_HELP[s]}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Ledger + chat */}
          <div className="space-y-6">
            <div className="border border-neutral-950 bg-white">
              <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
                <span className="mono text-[11px] tracking-[0.2em] text-neutral-500">MONEY & PROGRESS</span>
                <span className="mono text-[11px] tracking-widest text-neutral-500">{tx.code}</span>
              </div>
              <div className="px-6 py-5">
                <p className="mono text-[30px] font-semibold tabular-nums">{formatNGN(tx.amountKobo)}</p>
                <p className="mt-1 text-[12.5px] text-neutral-500">
                  {tx.status === 'AGREEMENT' && 'Not paid yet — buyer funds this first.'}
                  {tx.status === 'SECURED' && 'Paid and held safely. Seller has not received it yet.'}
                  {tx.status === 'DELIVERED' && 'Paid and held. Waiting on buyer to accept.'}
                  {tx.status === 'COMPLETED' && 'Released to the seller.'}
                  {tx.status === 'DISPUTED' && 'Locked — under review.'}
                  {tx.status === 'CANCELLED' && 'Cancelled — no money moved.'}
                  {tx.status === 'REFUNDED' && 'Returned to the buyer.'}
                </p>
                <div className="mt-4 grid grid-cols-2 divide-x divide-neutral-200 border-y border-neutral-200">
                  <div className="py-3 pr-4">
                    <p className="mono text-[10px] tracking-[0.2em] text-neutral-400">BUYER</p>
                    <p className="mt-1 text-[14px] font-semibold">{tx.buyer?.name ?? '—'}</p>
                  </div>
                  <div className="py-3 pl-4">
                    <p className="mono text-[10px] tracking-[0.2em] text-neutral-400">SELLER</p>
                    <p className="mt-1 text-[14px] font-semibold">{tx.seller?.name ?? '—'}</p>
                  </div>
                </div>
                {tx.events && tx.events.length > 0 && (
                  <div className="mt-6 border-t border-neutral-200 pt-4">
                    <p className="mono text-[10px] tracking-[0.2em] text-neutral-400">HISTORY</p>
                    <ul className="mt-2.5 space-y-2">
                      {tx.events.map((e) => (
                        <li key={e.id} className="text-[12.5px] leading-5 text-neutral-600">
                          <span className="mono text-[11px] text-neutral-400">
                            {new Date(e.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                          </span>{' '}
                          — {e.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {tx.deliveryNote && (
                  <div className="mt-5 border border-neutral-200 bg-neutral-50 p-4">
                    <p className="mono text-[10px] tracking-[0.2em] text-neutral-400">WHAT THE SELLER DELIVERED</p>
                    <p className="mt-1.5 whitespace-pre-line text-[13.5px] leading-6">{tx.deliveryNote}</p>
                    {tx.deliveryUrl && (
                      <a href={tx.deliveryUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[13px] font-medium underline underline-offset-4">
                        Open delivery link →
                      </a>
                    )}
                  </div>
                )}
                {tx.disputeReason && (
                  <div className="mt-5 border border-neutral-950 p-4">
                    <p className="mono text-[10px] tracking-[0.2em] text-neutral-500">WHY IT WAS DISPUTED</p>
                    <p className="mt-1.5 text-[13.5px] leading-6">{tx.disputeReason}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chat with the other side */}
            <div className="border border-neutral-200 bg-white">
              <div className="border-b border-neutral-200 px-6 py-4">
                <p className="mono text-[11px] tracking-[0.2em] text-neutral-500">CHAT WITH {otherName.toUpperCase()}</p>
                <p className="mt-1 text-[12.5px] text-neutral-500">Talk about this deal here — it stays as proof if there is a dispute.</p>
              </div>
              <div className="max-h-80 space-y-3 overflow-y-auto px-6 py-5">
                {chat.length === 0 && (
                  <p className="text-[13px] leading-6 text-neutral-500">
                    No messages yet. Say hello — e.g. “Hi, I just funded. How long will delivery take?”
                  </p>
                )}
                {chat.map((m) => (
                  <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-3.5 py-2.5 text-[13.5px] leading-6 ${m.mine ? 'bg-neutral-950 text-white' : 'border border-neutral-200 bg-neutral-50'}`}>
                      <p>{m.body}</p>
                      <p className={`mono mt-1 text-[10px] tracking-widest ${m.mine ? 'text-neutral-400' : 'text-neutral-400'}`}>
                        {m.mine ? 'YOU' : (m.senderName ?? 'THEM').toUpperCase()} — {new Date(m.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={sendChat} className="flex gap-2 border-t border-neutral-200 p-4">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Message ${otherName}…`}
                  maxLength={2000}
                  className="flex-1 border border-neutral-300 px-3.5 py-2.5 text-[14px] outline-none focus:border-neutral-950"
                />
                <button
                  type="submit"
                  disabled={chatBusy || !chatInput.trim()}
                  className="cursor-pointer bg-neutral-950 px-5 py-2.5 text-[13px] font-medium text-white disabled:opacity-50"
                >
                  {chatBusy ? 'Sending…' : 'Send'}
                </button>
              </form>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <div className="border border-neutral-200 bg-white p-6">
              <p className="mono text-[11px] tracking-[0.2em] text-neutral-500">WHAT TO DO NOW</p>
              <div className="mt-3 space-y-3">
                {isBuyer && tx.status === 'AGREEMENT' && (
                  <>
                    <button onClick={fund} disabled={busy !== null} className="w-full cursor-pointer bg-neutral-950 py-3 text-[14px] font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-60">
                      {busy === 'fund' ? 'Opening secure payment…' : `Pay ${formatNGN(tx.amountKobo)} — money stays safe`}
                    </button>
                    <button onClick={retryVerify} disabled={busy !== null} className="w-full cursor-pointer border border-neutral-300 py-2.5 text-[13px] font-medium transition-colors hover:border-neutral-950 disabled:opacity-50">
                      {busy === 'verify' ? 'Checking payment…' : 'I already paid — check payment'}
                    </button>
                    <button onClick={() => run('cancel', () => api.cancelTransaction(tx.id))} disabled={busy !== null} className="w-full cursor-pointer border border-neutral-300 py-2.5 text-[13px] font-medium text-neutral-500 transition-colors hover:border-neutral-950 hover:text-black disabled:opacity-50">
                      Cancel this deal
                    </button>
                  </>
                )}
                {isSeller && tx.status === 'AGREEMENT' && (
                  <>
                    <p className="text-[13px] leading-5 text-neutral-600">Waiting on the buyer to pay. You deliver only after you see “Payment secured”.</p>
                    <button onClick={() => run('cancel', () => api.cancelTransaction(tx.id))} disabled={busy !== null} className="w-full cursor-pointer border border-neutral-300 py-2.5 text-[13px] font-medium transition-colors hover:border-neutral-950 disabled:opacity-50">
                      Cancel this deal
                    </button>
                  </>
                )}
                {isSeller && tx.status === 'SECURED' && (
                  <div className="space-y-3">
                    <p className="text-[13px] leading-5 text-neutral-600">Money is secured. Describe what you delivered:</p>
                    <label className="block">
                      <span className="mb-1.5 block text-[13px] font-medium">What did you deliver?</span>
                      <textarea required rows={4} value={deliverNote} onChange={(e) => setDeliverNote(e.target.value)} placeholder="What you did, where to find it…" className="w-full border border-neutral-300 px-3.5 py-2.5 text-[14px] leading-6 outline-none focus:border-neutral-950" />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[13px] font-medium">Link <span className="font-normal text-neutral-400">— optional</span></span>
                      <input value={deliverUrl} onChange={(e) => setDeliverUrl(e.target.value)} placeholder="https://…" inputMode="url" className="w-full border border-neutral-300 px-3.5 py-2.5 text-[14px] outline-none focus:border-neutral-950" />
                    </label>
                    <button
                      onClick={() => deliverNote.trim() && run('deliver', () => api.deliverTransaction(tx.id, deliverNote.trim(), deliverUrl.trim() || undefined))}
                      disabled={busy !== null || !deliverNote.trim()}
                      className="w-full cursor-pointer bg-neutral-950 py-3 text-[14px] font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
                    >
                      {busy === 'deliver' ? 'Sending…' : 'Mark as delivered'}
                    </button>
                  </div>
                )}
                {isBuyer && tx.status === 'SECURED' && (
                  <p className="text-[13px] leading-5 text-neutral-600">Paid and secured. The seller is preparing your delivery — use the chat if you need to agree details.</p>
                )}
                {isBuyer && tx.status === 'DELIVERED' && (
                  <button onClick={() => run('accept', () => api.acceptTransaction(tx.id))} disabled={busy !== null} className="w-full cursor-pointer bg-neutral-950 py-3 text-[14px] font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-60">
                    {busy === 'accept' ? 'Completing…' : 'Happy with it? Accept & release money'}
                  </button>
                )}
                {isSeller && tx.status === 'DELIVERED' && (
                  <p className="text-[13px] leading-5 text-neutral-600">Delivered. Money releases when the buyer accepts.</p>
                )}
                {tx.status === 'COMPLETED' && (
                  <div className="space-y-2.5">
                    <p className="flex items-center gap-2 text-[13.5px] font-medium">
                      <ShieldCheck size={16} /> Done. Money released to the seller.
                    </p>
                    {payout ? (
                      <div className="border border-neutral-200 bg-neutral-50 p-3.5 text-[12.5px] leading-6">
                        <p className="mono text-[10px] tracking-[0.2em] text-neutral-500">PAYOUT — {payout.status}</p>
                        {isSeller && payout.bankName && (
                          <p className="mt-1 text-neutral-700">{payout.bankName} — ••••{payout.last4}</p>
                        )}
                        {payout.status !== 'SUCCESS' && (
                          <p className="mt-1 text-neutral-600">
                            {payout.failureReason ?? 'Transfer still processing.'}
                            {isSeller && (
                              <button
                                onClick={async () => {
                                  setBusy('payout');
                                  try {
                                    setPayout(await api.retryPayout(payout.id));
                                  } catch (err) {
                                    setActionError(err instanceof Error ? err.message : 'Retry failed.');
                                  } finally {
                                    setBusy(null);
                                  }
                                }}
                                disabled={busy !== null}
                                className="ml-2 cursor-pointer font-medium underline underline-offset-4 hover:text-black disabled:opacity-50"
                              >
                                Retry transfer
                              </button>
                            )}
                          </p>
                        )}
                      </div>
                    ) : (
                      isSeller && (
                        <p className="text-[12.5px] text-neutral-500">
                          No bank account saved yet — add one in Dashboard → Payouts to receive this money.
                        </p>
                      )
                    )}
                  </div>
                )}
                {tx.status === 'DISPUTED' && (
                  <p className="text-[13px] leading-5 text-neutral-600">Paused for review. Money stays locked. Keep talking in the chat above.</p>
                )}
                {tx.status === 'REFUNDED' && (
                  <p className="text-[13px] leading-5 text-neutral-600">Resolved — money went back to the buyer. Deal closed.</p>
                )}
                {tx.status === 'CANCELLED' && (
                  <p className="text-[13px] leading-5 text-neutral-600">Cancelled before payment. No money moved.</p>
                )}
                {!terminal && tx.status !== 'COMPLETED' && (
                  <div className="border-t border-neutral-200 pt-3">
                    {!showDispute ? (
                      <button onClick={() => setShowDispute(true)} className="cursor-pointer text-[13px] font-medium text-neutral-500 underline underline-offset-4 hover:text-black">
                        Something wrong? Report a problem
                      </button>
                    ) : (
                      <div className="space-y-2.5">
                        <textarea rows={3} value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} placeholder="What went wrong?…" className="w-full border border-neutral-300 px-3.5 py-2.5 text-[13.5px] leading-6 outline-none focus:border-neutral-950" />
                        <div className="flex gap-2">
                          <button
                            onClick={() => disputeReason.trim() && run('dispute', () => api.disputeTransaction(tx.id, disputeReason.trim()))}
                            disabled={busy !== null || !disputeReason.trim()}
                            className="flex-1 cursor-pointer bg-neutral-950 py-2.5 text-[13px] font-medium text-white disabled:opacity-60"
                          >
                            {busy === 'dispute' ? 'Sending…' : 'Report problem'}
                          </button>
                          <button onClick={() => setShowDispute(false)} className="cursor-pointer border border-neutral-300 px-4 py-2.5 text-[13px] font-medium">
                            Back
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <p className="text-[12.5px] leading-5 text-neutral-500">
              {isBuyer ? 'You are the buyer.' : isSeller ? 'You are the seller.' : ''} Money is held by the payment provider until release — this page is the proof.
            </p>

            {tx.status === 'COMPLETED' && (
              <div className="border border-neutral-200 bg-white p-6">
                <p className="mono text-[11px] tracking-[0.2em] text-neutral-500">RATE THIS DEAL</p>
                {(reviews ?? []).length > 0 && (
                  <ul className="mt-3 space-y-2.5">
                    {reviews!.map((r) => (
                      <li key={r.id} className="border-l-2 border-neutral-950 pl-3 text-[13px] leading-6">
                        <span className="font-semibold">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>{' '}
                        <span className="text-neutral-600">{r.comment || 'No comment.'}</span>
                        <span className="mono block text-[10.5px] tracking-widest text-neutral-400">
                          {r.mine ? 'YOU' : (r.reviewerName ?? 'THEM').toUpperCase()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {reviews && !reviews.some((r) => r.mine) ? (
                  <form onSubmit={submitReview} className="mt-3 space-y-2.5">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRatingSel(n)}
                          className={`cursor-pointer border px-3 py-1.5 text-[15px] transition-colors ${ratingSel >= n ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-300 text-neutral-400'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <input
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Say something nice (optional)…"
                      maxLength={1000}
                      className="w-full border border-neutral-300 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-neutral-950"
                    />
                    <button
                      type="submit"
                      disabled={reviewBusy}
                      className="w-full cursor-pointer bg-neutral-950 py-2.5 text-[13px] font-medium text-white disabled:opacity-50"
                    >
                      {reviewBusy ? 'Saving…' : `Rate ${otherName} ${ratingSel}/5`}
                    </button>
                  </form>
                ) : reviews && reviews.some((r) => r.mine) ? null : (
                  <p className="mono mt-3 text-[11px] tracking-widest text-neutral-400">LOADING REVIEWS…</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default function TransactionPage() {
  return (
    <Suspense>
      <TxRoom />
    </Suspense>
  );
}
