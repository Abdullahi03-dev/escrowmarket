import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { TransactionsService } from './transactions.service';
import { ResolveDisputeDto } from './dto/transaction.dto';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '../entities/user.entity';

/** Dispute arbitration. Promote an account first:
 *  UPDATE users SET role='ADMIN' WHERE email='you@example.com'; */
@Controller('admin/disputes')
@UseGuards(AdminGuard)
export class AdminDisputesController {
  constructor(private txs: TransactionsService) {}

  @Get()
  list() {
    return this.txs.listDisputed();
  }

  @Post(':id/resolve')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  resolve(
    @CurrentUser() admin: User,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.txs.resolveDispute(id, admin.id, dto.decision, dto.note);
  }
}
