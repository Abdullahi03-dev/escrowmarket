# SecureMarket (EscrowMarket)

Monochrome escrow marketplace — landing page + **real** authentication.
Spec: `prompt.md`. Frontend: `securemarket/` (Next.js 16). Backend: `backend/` (NestJS 11 + PostgreSQL via TypeORM).

## Quick start (local dev)

1. **Database (Neon)** — no Docker needed:
   - Go to [console.neon.tech](https://console.neon.tech) → New Project (free tier is fine).
   - Open **Connect**, copy the connection string (use the pooled one ending in `?sslmode=require`).
   - Paste it as `DATABASE_URL` in `backend/.env` (`DATABASE_SSL` stays `true`).
   - Tables (`users`, `accounts`, `sessions`, `verification_tokens`, `password_reset_tokens`)
     are auto-created on first backend boot (`TYPEORM_SYNC=true`, no extensions needed).
     For production DDL see `backend/sql/001_auth.sql` and set `TYPEORM_SYNC=false`.

2. **Backend** (port 3002):
   ```powershell
   cd backend
   npm run start:dev
   ```
   Health check: `GET http://localhost:3002/health`.

3. **Frontend** (port 3000):
   ```powershell
   cd securemarket
   npm run dev
   ```
   Open `http://localhost:3000`.

## End-to-end auth flow

1. `/` — landing page.
2. `/register` — creates a real user in PostgreSQL (bcrypt-hashed password).
   Dev returns a verification token (prod sends it by email).
3. `/onboarding` — pick BUYER / SELLER / BOTH, set display name, username, bio.
4. `/dashboard` — protected product surface (Overview / Profile / Security tabs).
   Unauthenticated visits redirect to `/login`. Profile edits, password changes
   and session revocation all hit the API with the session cookie.
5. `/login`, `/logout` (dashboard button), session persists via httpOnly `sm_session` cookie (30 days).
6. `/forgot-password` → `/reset-password` — generic responses (no email enumeration), single-use 60-min tokens, resets revoke all sessions.
7. `/verify-email` — 24-hour single-use tokens, stored hashed.

## API (backend, `http://localhost:3002`)

| Method | Path | Notes |
|---|---|---|
| GET | `/health` | liveness |
| POST | `/auth/register` | sets session cookie |
| POST | `/auth/login` | sets session cookie, 10/min throttle |
| POST | `/auth/logout` | clears cookie + deletes session |
| GET | `/auth/me` | requires session (cookie or `Bearer`) |
| PATCH | `/auth/onboarding` | role BUYER/SELLER/BOTH + profile |
| PATCH | `/auth/profile` | update name/username/bio/avatar |
| POST | `/auth/change-password` | `{ currentPassword, newPassword }`, revokes other sessions |
| GET | `/auth/sessions` | list own sessions, flags current device |
| DELETE | `/auth/sessions/others` | log out all other devices |
| DELETE | `/auth/sessions/:id` | revoke one session (not the current one) |
| GET | `/listings` | public browse: `?q=&kind=&category=&sort=&page=&limit=` |
| GET | `/listings/mine` | seller's own listings |
| GET | `/listings/:id` | listing detail + seller |
| POST | `/listings` | create (SELLER/BOTH/ADMIN), price in Naira → stored as kobo |
| PATCH | `/listings/:id` | owner edit (incl. ACTIVE/PAUSED/ARCHIVED) |
| DELETE | `/listings/:id` | owner archive |
| POST | `/transactions` | buyer opens agreement on a listing |
| GET | `/transactions/mine?side=` | buying / selling / all |
| GET | `/transactions/:id` | detail + ledger events (participants only) |
| POST | `/transactions/:id/fund` | buyer funds: Paystack if configured, test-mode in dev |
| POST | `/transactions/:id/verify-payment` | confirm Paystack payment by reference |
| POST | `/transactions/:id/paystack/webhook` | charge.success → SECURED (signature-checked) |
| POST | `/transactions/:id/deliver` | seller submits delivery |
| POST | `/transactions/:id/accept` | buyer accepts → COMPLETED, salesCount++ |
| POST | `/transactions/:id/dispute` | participant opens dispute with reason |
| POST | `/transactions/:id/cancel` | cancel unfunded agreement |
| GET | `/transactions/:id/messages` | escrow chat (participants only) |
| POST | `/transactions/:id/messages` | send chat message (≤2000 chars) |
| GET | `/payouts/banks` | Nigerian bank list (Paystack, cached 24h) |
| GET | `/payouts/recipient` | own saved bank (masked) |
| POST | `/payouts/recipient/resolve` | verify account name before saving |
| POST | `/payouts/recipient` | verify + save bank (stores code + last4 only) |
| GET | `/payouts/mine` | seller payout history |
| GET | `/payouts/by-transaction/:txId` | payout for a deal (seller sees bank, buyer sees status) |
| POST | `/payouts/:id/retry` | retry stuck transfer |
| POST | `/payouts/:id/refresh` | re-check transfer at Paystack |
| POST | `/payouts/paystack/webhook` | transfer.success/failed → status (signature-checked, optional) |
| GET | `/admin/disputes` | ADMIN: open disputes |
| POST | `/admin/disputes/:id/resolve` | ADMIN: `{ decision: release\|refund, note }` |
| POST | `/reviews` | rate other side of a COMPLETED deal (1–5, once per side) |
| GET | `/reviews/user/:username` | public reviews + avg + count |
| GET | `/reviews/transaction/:txId` | both reviews for a deal (participants) |
| POST | `/auth/verify-email` / GET with `?token=` | verify |
| POST | `/auth/resend-verification` | authed |
| POST | `/auth/forgot-password` | always generic, 5/min throttle |
| POST | `/auth/reset-password` | `{ token, newPassword }` |
| GET | `/auth/google` | `501 OAUTH_NOT_CONFIGURED` until `GOOGLE_CLIENT_ID/SECRET` are set; `Account` entity is ready |

## Marketplace

- `/marketplace` — live grid: search, type/category filter, sort, pagination.
- `/marketplace/new` — sell form (SELLER/BOTH roles; buyer-only accounts get redirected to update role).
- `/marketplace/:id` — detail, seller card, **Buy — fund escrow** → opens a transaction.
- `/marketplace/:id/edit` — owner edit + pause/archive.
- `/transactions/:id` — escrow room: ledger timeline, fund (Paystack or dev test-mode),
  deliver, accept, dispute, cancel — every step role- and state-checked server-side.
- Dashboard → Transactions section lists your real deals with live counters.
- Seed demo data: `cd backend; npm run seed` (demo seller `nahoolearn@gmail.com` + 4 listings).

Live payments: set `PAYSTACK_SECRET_KEY` in `backend/.env` (keys at
dashboard.paystack.com → Settings → Developers). Without it, dev funding runs in
explicitly-labelled test mode; production returns `501 PAYMENT_NOT_CONFIGURED`.

No webhook URL is required in the Paystack dashboard: redirect-back
`verify-payment` (with stored `paymentReference` + retry button) is the primary
path, and both webhooks are signature-checked optionals for later.

## Payouts (sellers get paid)

1. Seller opens Dashboard → Payouts, picks bank, enters 10-digit account number,
   verifies the account name (Paystack resolve), saves. Only the recipient code
   + bank name + last4 are stored — never the full account number.
2. Buyer accepts delivery → `COMPLETED` → backend initiates a Paystack Transfer
   for the full escrow value. Failures (no bank saved, low balance) land as
   retryable `PENDING`/`FAILED` rows with a Retry button.
3. Test keys: enable transfers in Paystack test mode (transfers may need OTP
   disabled in Settings → Preferences). Without a key, test-mode deals complete
   with no real movement.

## Dispute arbitration

- Any `DISPUTED` deal waits for an admin. Promote one:
  `UPDATE users SET role='ADMIN' WHERE email='you@example.com';`
- Dashboard → Disputes (admin-only): read ledger + chat evidence, then **Release
  to seller** (completes + pays out) or **Refund buyer** (Paystack refund API
  when live-funded, direct mark when test-funded). Resolved refunds show as
  `REFUNDED`; every decision is written to the ledger with the admin note.

## Reviews + My Listings

- `/marketplace/mine` — seller shop: pause/resume/archive, sales counts.
- After `COMPLETED`, both sides can rate each other once (1–5 + optional note).
  Seller average shows on listing pages.

## Production checklist

- `backend/sql/001_auth.sql` + `002_marketplace.sql` are the full DDL —
  run both with `TYPEORM_SYNC=false`.
- Backend fails fast without `DATABASE_URL`.
- Dev-only gaps left: email delivery (verification/reset tokens are returned in
  dev responses instead of SMTP), no in-app notifications yet.

## Security properties

- bcryptjs (12 rounds), never returns `passwordHash`.
- Opaque 256-bit session tokens; only SHA-256 hashes stored (`sessions.tokenHash`).
- httpOnly, `SameSite=Lax`, `Secure` in production cookies.
- `class-validator` whitelisting, Helmet, throttler, CORS with credentials limited to `FRONTEND_URL`.
- Email/username uniqueness (citext = case-insensitive), no password/token leakage, no enumeration on forgot-password.

## Google OAuth

Architected, not faked: `accounts` table + `GET /auth/google` returns a clear
`OAUTH_NOT_CONFIGURED` message (frontend shows the same note). Set
`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` and implement the callback against
the `Account` entity (`provider='google'`) to enable it.
