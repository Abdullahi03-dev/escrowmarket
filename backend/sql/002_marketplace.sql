-- SecureMarket marketplace + escrow schema (PostgreSQL).
-- Run AFTER sql/001_auth.sql when TYPEORM_SYNC=false in production:
--
--   psql "$DATABASE_URL" -f sql/001_auth.sql -f sql/002_marketplace.sql
--
-- Idempotent: safe to re-run. Matches src/entities/*.entity.ts
-- (TypeORM synchronize creates the same shape in dev).

-- New user columns for Paystack transfer recipients.
ALTER TABLE users ADD COLUMN IF NOT EXISTS "payoutRecipientCode" VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "payoutBankName" VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "payoutAccountName" VARCHAR(120);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "payoutLast4" VARCHAR(4);

CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sellerId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(140) NOT NULL,
  description TEXT NOT NULL,
  "priceKobo" BIGINT NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'NGN',
  kind VARCHAR(16) NOT NULL CHECK (kind IN ('PRODUCT','SERVICE')),
  category VARCHAR(32) NOT NULL,
  "imageUrl" VARCHAR,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE','PAUSED','ARCHIVED')),
  "salesCount" INT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS listings_status_created_idx
  ON listings (status, "createdAt");

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(16) UNIQUE NOT NULL,
  "listingId" UUID REFERENCES listings(id) ON DELETE SET NULL,
  "listingTitle" VARCHAR(140) NOT NULL,
  "amountKobo" BIGINT NOT NULL,
  "buyerId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "sellerId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(16) NOT NULL DEFAULT 'AGREEMENT'
    CHECK (status IN ('AGREEMENT','SECURED','DELIVERED','COMPLETED','DISPUTED','CANCELLED','REFUNDED')),
  "fundedVia" VARCHAR(16),
  "paymentReference" VARCHAR(80),
  "paidAt" TIMESTAMPTZ,
  "deliveryNote" TEXT,
  "deliveryUrl" VARCHAR,
  "disputeReason" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ("buyerId" <> "sellerId")
);

CREATE TABLE IF NOT EXISTS transaction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "transactionId" UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  type VARCHAR(32) NOT NULL,
  "actorId" UUID REFERENCES users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS transaction_events_tx_idx
  ON transaction_events ("transactionId", "createdAt");

CREATE TABLE IF NOT EXISTS transaction_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "transactionId" UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  "senderId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS transaction_messages_tx_idx
  ON transaction_messages ("transactionId", "createdAt");

CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "transactionId" UUID UNIQUE NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  "sellerId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "amountKobo" BIGINT NOT NULL,
  "recipientCode" VARCHAR(64) NOT NULL,
  reference VARCHAR(80) UNIQUE NOT NULL,
  "transferCode" VARCHAR(64),
  status VARCHAR(16) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','SUCCESS','FAILED')),
  "failureReason" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "transactionId" UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  "reviewerId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "revieweeId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("transactionId", "reviewerId")
);
CREATE INDEX IF NOT EXISTS reviews_reviewee_idx
  ON reviews ("revieweeId", "createdAt");

-- Promote an admin for dispute arbitration:
--   UPDATE users SET role='ADMIN' WHERE email='you@example.com';
