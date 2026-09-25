import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/review.dto';
import { SessionGuard } from '../auth/session.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '../entities/user.entity';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviews: ReviewsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  create(@CurrentUser() user: User, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user.id, dto.transactionId, dto.rating, dto.comment);
  }

  @Get('user/:username')
  forUser(@Param('username') username: string) {
    return this.reviews.forUser(username);
  }

  @Get('transaction/:txId')
  @UseGuards(SessionGuard)
  forTransaction(@CurrentUser() user: User, @Param('txId') txId: string) {
    return this.reviews.forTransaction(txId, user.id);
  }
}
