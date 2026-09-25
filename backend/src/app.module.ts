import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { AuthModule } from './auth/auth.module';
import { ListingsModule } from './listings/listings.module';
import { TransactionsModule } from './transactions/transactions.module';
import { PayoutsModule } from './payouts/payouts.module';
import { ReviewsModule } from './reviews/reviews.module';
import { User } from './entities/user.entity';
import { Account } from './entities/account.entity';
import { Session } from './entities/session.entity';
import { VerificationToken } from './entities/verification-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { Listing } from './entities/listing.entity';
import { Transaction } from './entities/transaction.entity';
import { TransactionEvent } from './entities/transaction-event.entity';
import { TransactionMessage } from './entities/transaction-message.entity';
import { Payout } from './entities/payout.entity';
import { Review } from './entities/review.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [User, Account, Session, VerificationToken, PasswordResetToken, Listing, Transaction, TransactionEvent, TransactionMessage, Payout, Review],
        // Dev convenience: auto-create the auth tables from entities.
        // For production, use a real migration (see README + sql/001_auth.sql).
        synchronize: config.get<string>('TYPEORM_SYNC', 'true') === 'true',
        ssl:
          config.get<string>('DATABASE_SSL', 'false') === 'true'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),
      AuthModule,
      ListingsModule,
      TransactionsModule,
      PayoutsModule,
      ReviewsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
