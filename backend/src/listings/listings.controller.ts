import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ListingsService } from './listings.service';
import { CreateListingDto, UpdateListingDto } from './dto/listing.dto';
import { SessionGuard } from '../auth/session.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '../entities/user.entity';

@Controller('listings')
export class ListingsController {
  constructor(private listings: ListingsService) {}

  @Get()
  browse(
    @Query('q') q?: string,
    @Query('kind') kind?: string,
    @Query('category') category?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.listings.browse({ q, kind, category, sort, page: Number(page), limit: Number(limit) });
  }

  @Get('mine')
  @UseGuards(SessionGuard)
  mine(@CurrentUser() user: User) {
    return this.listings.mine(user.id);
  }

  @Get(':id')
  detail(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.listings.detail(id);
  }

  @Post()
  @UseGuards(SessionGuard)
  create(@CurrentUser() user: User, @Body() dto: CreateListingDto) {
    return this.listings.create(user.id, user.role, dto);
  }

  @Patch(':id')
  @UseGuards(SessionGuard)
  update(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateListingDto,
  ) {
    return this.listings.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(SessionGuard)
  remove(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.listings.archive(id, user.id);
  }
}
