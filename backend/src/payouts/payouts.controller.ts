import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { PayoutsService } from './payouts.service';
import { SaveRecipientDto, ResolveAccountDto } from './dto/payout.dto';
import { SessionGuard } from '../auth/session.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '../entities/user.entity';

@Controller('payouts')
export class PayoutsController {
  constructor(private payouts: PayoutsService) {}

  @Get('banks')
  @UseGuards(SessionGuard)
  banks() {
    return this.payouts.banks();
  }

  @Get('recipient')
  @UseGuards(SessionGuard)
  recipient(@CurrentUser() user: User) {
    return this.payouts.myRecipient(user.id);
  }

  @Post('recipient/resolve')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  resolve(@Body() dto: ResolveAccountDto) {
    return this.payouts.resolveAccount(dto.accountNumber, dto.bankCode);
  }

  @Post('recipient')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  save(@CurrentUser() user: User, @Body() dto: SaveRecipientDto) {
    return this.payouts.saveRecipient(user.id, dto.accountNumber, dto.bankCode);
  }

  @Get('mine')
  @UseGuards(SessionGuard)
  mine(@CurrentUser() user: User) {
    return this.payouts.mine(user.id);
  }

  @Get('by-transaction/:txId')
  @UseGuards(SessionGuard)
  byTransaction(
    @CurrentUser() user: User,
    @Param('txId', new ParseUUIDPipe()) txId: string,
  ) {
    return this.payouts.forTransaction(txId, user.id);
  }

  @Post(':id/retry')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  retry(@CurrentUser() user: User, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.payouts.retry(id, user.id);
  }

  @Post(':id/refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  refresh(@CurrentUser() user: User, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.payouts.refresh(id, user.id);
  }

  @Post('paystack/webhook')
  @HttpCode(HttpStatus.OK)
  transferWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature?: string,
  ) {
    const raw = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);
    return this.payouts.transferWebhook(raw, signature);
  }
}
