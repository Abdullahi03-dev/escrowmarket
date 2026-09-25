/**
 * Seeds the marketplace with a demo seller + listings.
 * Idempotent — skips if the demo seller already exists.
 *
 *   npm run seed
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { User } from './entities/user.entity';
import { Account } from './entities/account.entity';
import { Listing } from './entities/listing.entity';
import { Session } from './entities/session.entity';
import { VerificationToken } from './entities/verification-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { Transaction } from './entities/transaction.entity';
import { TransactionEvent } from './entities/transaction-event.entity';
import { TransactionMessage } from './entities/transaction-message.entity';
import { Payout } from './entities/payout.entity';
import { Review } from './entities/review.entity';

dotenv.config();

const DEMO_EMAIL = 'nahoolearn@gmail.com';

const LISTINGS: Array<{
  title: string;
  description: string;
  priceNaira: number;
  kind: 'PRODUCT' | 'SERVICE';
  category: string;
}> = [
  {
    title: 'Python for Fintech',
    description:
      'A hands-on video course: Python for payments, ledgers and reconciliations. 42 lessons, real codebases, lifetime updates and a certificate on completion.',
    priceNaira: 25000,
    kind: 'PRODUCT',
    category: 'Course',
  },
  {
    title: 'Notion Freelancer OS',
    description:
      'The complete Notion workspace for freelancers: client CRM, invoicing, project tracker and content pipeline. Duplicate link delivered instantly.',
    priceNaira: 8500,
    kind: 'PRODUCT',
    category: 'Template',
  },
  {
    title: 'Afrobeats Drum Kit',
    description:
      '240 royalty-free drums, loops and one-shots recorded in Lagos. WAV + stems, BPM-labelled, cleared for commercial release.',
    priceNaira: 12000,
    kind: 'PRODUCT',
    category: 'Audio',
  },
  {
    title: 'Brand Identity Sprint',
    description:
      'A focused 5-day identity sprint: logo suite, color system, typography and a 20-page brand guideline. Two revision rounds included, full source files handed over.',
    priceNaira: 120000,
    kind: 'SERVICE',
    category: 'Service',
  },
];

async function main() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [User, Account, Session, VerificationToken, PasswordResetToken, Listing, Transaction, TransactionEvent, TransactionMessage, Payout, Review],
    synchronize: true,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });
  await ds.initialize();

  const users = ds.getRepository(User);
  const accounts = ds.getRepository(Account);
  const listings = ds.getRepository(Listing);

  let demo = await users.findOne({ where: { email: DEMO_EMAIL } });
  if (!demo) {
    demo = await users.save(
      users.create({
        email: DEMO_EMAIL,
        passwordHash: await bcrypt.hash('SecureMarket123!', 12),
        name: 'SecureMarket Demo',
        username: 'securemarket',
        bio: 'Official demo seller showcasing the marketplace.',
        role: 'SELLER',
        emailVerified: true,
        onboardingCompleted: true,
      }),
    );
    await accounts.save(
      accounts.create({
        userId: demo.id,
        provider: 'credentials',
        providerAccountId: DEMO_EMAIL,
      }),
    );
    // eslint-disable-next-line no-console
    console.log(`demo seller created (${DEMO_EMAIL} / SecureMarket123!)`);
  } else {
    // eslint-disable-next-line no-console
    console.log('demo seller already exists — skipping user creation');
  }

  let created = 0;
  for (const l of LISTINGS) {
    const exists = await listings.findOne({
      where: { sellerId: demo.id, title: l.title },
    });
    if (exists) continue;
    await listings.save(
      listings.create({
        sellerId: demo.id,
        title: l.title,
        description: l.description,
        priceKobo: String(l.priceNaira * 100),
        currency: 'NGN',
        kind: l.kind,
        category: l.category,
        status: 'ACTIVE',
      }),
    );
    created++;
  }
  // eslint-disable-next-line no-console
  console.log(`seeded ${created} new listing(s)`);
  await ds.destroy();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
