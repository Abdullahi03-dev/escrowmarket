import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../entities/transaction.entity';
import { TransactionEvent } from '../entities/transaction-event.entity';
import { TransactionMessage } from '../entities/transaction-message.entity';
import { Listing } from '../entities/listing.entity';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { AdminDisputesController } from './admin-disputes.controller';
import { AuthModule } from '../auth/auth.module';
import { PayoutsModule } from '../payouts/payouts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, TransactionEvent, TransactionMessage, Listing]),
    AuthModule,
    PayoutsModule,
  ],
  controllers: [TransactionsController, AdminDisputesController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
