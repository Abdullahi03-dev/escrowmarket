export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? '/api';

export type ApiUser = {
  id: string;
  email: string | null;
  name: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  role: 'BUYER' | 'SELLER' | 'BOTH' | 'ADMIN';
  emailVerified: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApiSession = {
  id: string;
  createdAt: string;
  expiresAt: string;
  current: boolean;
};

export type ApiSeller = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  emailVerified: boolean;
};

export type ApiListing = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  priceKobo: string;
  currency: string;
  kind: 'PRODUCT' | 'SERVICE';
  category: string;
  imageUrl: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  salesCount: number;
  createdAt: string;
  updatedAt: string;
  seller?: ApiSeller;
};

export type TxEvent = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
};

export type ApiTransaction = {
  id: string;
  code: string;
  listingId: string;
  listingTitle: string;
  amountKobo: string;
  buyerId: string;
  sellerId: string;
  buyer?: ApiSeller;
  seller?: ApiSeller;
  status: 'AGREEMENT' | 'SECURED' | 'DELIVERED' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED' | 'REFUNDED';
  fundedVia: string | null;
  paymentReference: string | null;
  paidAt: string | null;
  deliveryNote: string | null;
  deliveryUrl: string | null;
  disputeReason: string | null;
  createdAt: string;
  updatedAt: string;
  events?: TxEvent[];
};

export type ApiChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  senderName?: string;
  mine?: boolean;
};

export type ApiPayout = {
  id: string;
  transactionId: string;
  code?: string;
  listingTitle?: string;
  amountKobo: string;
  reference: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  bankName?: string;
  last4?: string;
};

export type ApiBank = { name: string; code: string };

export type ApiRecipient =
  | { saved: false }
  | { saved: true; bankName: string | null; accountName: string | null; last4: string | null };

export type ApiReview = {
  id: string;
  transactionId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerName?: string;
  reviewerUsername?: string;
  mine?: boolean;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (data as { message?: string | string[] }).message ??
      `Request failed (${res.status})`;
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }
  return data as T;
}

export const api = {
  health: () => request<{ ok: boolean }>('/health'),
  me: () => request<{ user: ApiUser }>('/auth/me'),
  register: (body: {
    name: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) =>
    request<{ user: ApiUser; verification: { devToken?: string } }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify(body) },
    ),
  login: (body: { email: string; password: string }) =>
    request<{ user: ApiUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  logout: () =>
    request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  onboarding: (body: {
    role: string;
    name?: string;
    username?: string;
    bio?: string;
  }) =>
    request<{ user: ApiUser }>('/auth/onboarding', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  forgotPassword: (email: string) =>
    request<{ ok: boolean; message: string; devToken?: string }>(
      '/auth/forgot-password',
      { method: 'POST', body: JSON.stringify({ email }) },
    ),
  resetPassword: (token: string, newPassword: string) =>
    request<{ ok: boolean }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),
  verifyEmail: (token: string) =>
    request<{ ok: boolean }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
  resendVerification: () =>
    request<{ alreadyVerified?: boolean; devToken?: string }>(
      '/auth/resend-verification',
      { method: 'POST', body: JSON.stringify({}) },
    ),
  updateProfile: (body: {
    name?: string;
    username?: string;
    bio?: string;
    avatarUrl?: string;
  }) =>
    request<{ user: ApiUser }>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: boolean; revokedOtherSessions: number }>(
      '/auth/change-password',
      { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) },
    ),
  sessions: () => request<{ sessions: ApiSession[] }>('/auth/sessions'),
  revokeSession: (id: string) =>
    request<{ ok: boolean }>(`/auth/sessions/${id}`, { method: 'DELETE' }),
  revokeOtherSessions: () =>
    request<{ ok: boolean; revoked: number }>('/auth/sessions/others', {
      method: 'DELETE',
    }),
  listings: (params: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    }
    const suffix = qs.toString();
    return request<{ items: ApiListing[]; total: number; page: number; pages: number; categories: string[] }>(
      `/listings${suffix ? `?${suffix}` : ''}`,
    );
  },
  listing: (id: string) => request<ApiListing>(`/listings/${id}`),
  myListings: () => request<ApiListing[]>('/listings/mine'),
  createListing: (body: {
    title: string;
    description: string;
    priceNaira: number;
    kind: string;
    category: string;
    imageUrl?: string;
  }) => request<ApiListing>('/listings', { method: 'POST', body: JSON.stringify(body) }),
  updateListing: (id: string, body: Record<string, unknown>) =>
    request<ApiListing>(`/listings/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  archiveListing: (id: string) =>
    request<ApiListing>(`/listings/${id}`, { method: 'DELETE' }),
  createTransaction: (listingId: string) =>
    request<ApiTransaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify({ listingId }),
    }),
  myTransactions: (side = 'all') =>
    request<ApiTransaction[]>(`/transactions/mine?side=${side}`),
  transaction: (id: string) => request<ApiTransaction>(`/transactions/${id}`),
  fundTransaction: (id: string) =>
    request<{ provider: string; authorizationUrl?: string; reference?: string; testMode?: boolean }>(
      `/transactions/${id}/fund`,
      { method: 'POST', body: JSON.stringify({}) },
    ),
  verifyTransactionPayment: (id: string, reference: string) =>
    request<ApiTransaction>(`/transactions/${id}/verify-payment`, {
      method: 'POST',
      body: JSON.stringify({ reference }),
    }),
  deliverTransaction: (id: string, note: string, deliveryUrl?: string) =>
    request<ApiTransaction>(`/transactions/${id}/deliver`, {
      method: 'POST',
      body: JSON.stringify({ note, deliveryUrl }),
    }),
  acceptTransaction: (id: string) =>
    request<ApiTransaction>(`/transactions/${id}/accept`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  disputeTransaction: (id: string, reason: string) =>
    request<ApiTransaction>(`/transactions/${id}/dispute`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  cancelTransaction: (id: string) =>
    request<ApiTransaction>(`/transactions/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  chatMessages: (id: string) =>
    request<ApiChatMessage[]>(`/transactions/${id}/messages`),
  sendChatMessage: (id: string, body: string) =>
    request<ApiChatMessage>(`/transactions/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
  payoutBanks: () => request<ApiBank[]>('/payouts/banks'),
  payoutRecipient: () => request<ApiRecipient>('/payouts/recipient'),
  resolveBankAccount: (accountNumber: string, bankCode: string) =>
    request<{ accountName: string; accountNumber?: string }>('/payouts/recipient/resolve', {
      method: 'POST',
      body: JSON.stringify({ accountNumber, bankCode }),
    }),
  saveBankAccount: (accountNumber: string, bankCode: string) =>
    request<{ bankName: string; accountName: string; last4: string }>('/payouts/recipient', {
      method: 'POST',
      body: JSON.stringify({ accountNumber, bankCode }),
    }),
  myPayouts: () => request<ApiPayout[]>('/payouts/mine'),
  payoutForTransaction: (txId: string) =>
    request<ApiPayout | null>(`/payouts/by-transaction/${txId}`),
  retryPayout: (id: string) =>
    request<ApiPayout>(`/payouts/${id}/retry`, { method: 'POST', body: JSON.stringify({}) }),
  refreshPayout: (id: string) =>
    request<ApiPayout>(`/payouts/${id}/refresh`, { method: 'POST', body: JSON.stringify({}) }),
  createReview: (transactionId: string, rating: number, comment?: string) =>
    request<ApiReview>('/reviews', {
      method: 'POST',
      body: JSON.stringify({ transactionId, rating, comment }),
    }),
  reviewsForUser: (username: string) =>
    request<{ reviews: ApiReview[]; count: number; avg: number | null }>(`/reviews/user/${username}`),
  reviewsForTransaction: (txId: string) =>
    request<ApiReview[]>(`/reviews/transaction/${txId}`),
  adminDisputes: () => request<ApiTransaction[]>('/admin/disputes'),
  resolveDispute: (id: string, decision: 'release' | 'refund', note: string) =>
    request<ApiTransaction>(`/admin/disputes/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ decision, note }),
    }),
};
