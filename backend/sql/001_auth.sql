-- SecureMarket auth schema (PostgreSQL).
-- Used when TYPEORM_SYNC=false in production. In dev, TypeORM synchronize
-- creates these tables automatically from src/entities/*.entity.ts.
--
--   psql "$DATABASE_URL" -f sql/001_auth.sql

-- No extensions required: ids use gen_random_uuid() (built into PG 13+)
-- and emails/usernames are stored lower-cased by the app, so plain
-- VARCHAR uniques enforce case-insensitive uniqueness.

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(254) UNIQUE,
  "passwordHash" VARCHAR,
  name VARCHAR(120) NOT NULL,
  username VARCHAR(30) UNIQUE NOT NULL,
  "avatarUrl" VARCHAR,
  bio VARCHAR(280),
  role VARCHAR(16) NOT NULL DEFAULT 'BOTH'
    CHECK (role IN ('BUYER','SELLER','BOTH','ADMIN')),
  "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "onboardingCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(64) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "expiresAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "tokenHash" VARCHAR(128) UNIQUE NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier VARCHAR(254) NOT NULL,
  "tokenHash" VARCHAR(128) UNIQUE NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS verification_tokens_identifier_idx
  ON verification_tokens (identifier);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "tokenHash" VARCHAR(128) UNIQUE NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "usedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
