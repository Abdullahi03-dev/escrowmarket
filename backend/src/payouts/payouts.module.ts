import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payout } from '../entities/payout.entity';
import { Transaction } from '../entities/transaction.entity';
import { User } from '../entities/user.entity';
import { PayoutsService } from './payouts.service';
import { PayoutsController } from './payouts.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payout, Transaction, User]),
    AuthModule,
  ],
  controllers: [PayoutsController],
  providers: [PayoutsService],
  exports: [PayoutsService],
})
export class PayoutsModule {}
