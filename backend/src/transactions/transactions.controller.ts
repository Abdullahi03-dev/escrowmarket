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
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { TransactionsService } from './transactions.service';
import { DeliverDto, DisputeDto, ChatMessageDto } from './dto/transaction.dto';
import { SessionGuard } from '../auth/session.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '../entities/user.entity';
import { Throttle } from '@nestjs/throttler';

@Controller('transactions')
export class TransactionsController {
  constructor(private txs: TransactionsService) {}

  @Post()
  @UseGuards(SessionGuard)
  create(@CurrentUser() user: User, @Body() body: { listingId: string }) {
    return this.txs.create(user.id, body.listingId);
  }

  @Get('mine')
  @UseGuards(SessionGuard)
  mine(@CurrentUser() user: User, @Query('side') side?: string) {
    return this.txs.mine(user.id, side ?? 'all');
  }

  @Post('paystack/webhook')
  @HttpCode(HttpStatus.OK)
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature?: string,
  ) {
    const raw = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);
    return this.txs.paystackWebhook(raw, signature);
  }

  @Get(':id')
  @UseGuards(SessionGuard)
  detail(@CurrentUser() user: User, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.txs.detailFor(id, user.id);
  }

  @Post(':id/fund')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  fund(@CurrentUser() user: User, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.txs.fund(id, user.id);
  }

  @Post(':id/verify-payment')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  verify(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { reference: string },
  ) {
    return this.txs.verifyPayment(id, user.id, body.reference);
  }

  @Get(':id/messages')
  @UseGuards(SessionGuard)
  messages(@CurrentUser() user: User, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.txs.listMessages(id, user.id);
  }

  @Post(':id/messages')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  sendMessage(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ChatMessageDto,
  ) {
    return this.txs.postMessage(id, user.id, dto.body);
  }

  @Post(':id/deliver')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  deliver(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: DeliverDto,
  ) {
    return this.txs.deliver(id, user.id, dto.note, dto.deliveryUrl);
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  accept(@CurrentUser() user: User, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.txs.accept(id, user.id);
  }

  @Post(':id/dispute')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  dispute(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: DisputeDto,
  ) {
    return this.txs.dispute(id, user.id, dto.reason);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  cancel(@CurrentUser() user: User, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.txs.cancel(id, user.id);
  }
}
