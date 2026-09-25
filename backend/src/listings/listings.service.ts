import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing, LISTING_CATEGORIES } from '../entities/listing.entity';
import { CreateListingDto, UpdateListingDto } from './dto/listing.dto';

export const SELLER_ROLES = ['SELLER', 'BOTH', 'ADMIN'];

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing) private listings: Repository<Listing>,
  ) {}

  async browse(query: {
    q?: string;
    kind?: string;
    category?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(48, Math.max(1, Number(query.limit) || 12));
    const qb = this.listings
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.seller', 'seller')
      .where('l.status = :status', { status: 'ACTIVE' });

    if (query.kind === 'PRODUCT' || query.kind === 'SERVICE') {
      qb.andWhere('l.kind = :kind', { kind: query.kind });
    }
    if (
      query.category &&
      (LISTING_CATEGORIES as readonly string[]).includes(query.category)
    ) {
      qb.andWhere('l.category = :category', { category: query.category });
    }
    if (query.q?.trim()) {
      qb.andWhere('(l.title ILIKE :q OR l.description ILIKE :q)', {
        q: `%${query.q.trim()}%`,
      });
    }
    switch (query.sort) {
      case 'price-asc':
        qb.orderBy('l.priceKobo', 'ASC');
        break;
      case 'price-desc':
        qb.orderBy('l.priceKobo', 'DESC');
        break;
      default:
        qb.orderBy('l.createdAt', 'DESC');
    }
    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      items: items.map((l) => this.present(l, true)),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      categories: [...LISTING_CATEGORIES],
    };
  }

  async detail(id: string) {
    const listing = await this.findOrThrow(id);
    return this.present(listing, true);
  }

  async create(sellerId: string, sellerRole: string, dto: CreateListingDto) {
    if (!SELLER_ROLES.includes(sellerRole)) {
      throw new ForbiddenException(
        'Only sellers can list. Switch your role to Seller or Both in onboarding.',
      );
    }
    const listing = await this.listings.save(
      this.listings.create({
        sellerId,
        title: dto.title,
        description: dto.description,
        priceKobo: String(Math.round(dto.priceNaira * 100)),
        currency: 'NGN',
        kind: dto.kind,
        category: dto.category,
        imageUrl: dto.imageUrl ?? null,
        status: 'ACTIVE',
      }),
    );
    return this.present(await this.findOrThrow(listing.id), false);
  }

  async update(id: string, sellerId: string, dto: UpdateListingDto) {
    const listing = await this.findOrThrow(id);
    this.assertOwner(listing, sellerId);
    if (dto.title !== undefined) listing.title = dto.title;
    if (dto.description !== undefined) listing.description = dto.description;
    if (dto.priceNaira !== undefined)
      listing.priceKobo = String(Math.round(dto.priceNaira * 100));
    if (dto.category !== undefined) listing.category = dto.category;
    if (dto.imageUrl !== undefined) listing.imageUrl = dto.imageUrl;
    if (dto.status !== undefined) listing.status = dto.status;
    await this.listings.save(listing);
    return this.present(await this.findOrThrow(id), false);
  }

  async archive(id: string, sellerId: string) {
    return this.update(id, sellerId, { status: 'ARCHIVED' });
  }

  async mine(sellerId: string) {
    const items = await this.listings.find({
      where: { sellerId },
      order: { createdAt: 'DESC' },
    });
    return items.map((l) => this.present(l, false));
  }

  async findOrThrow(id: string) {
    const listing = await this.listings.findOne({
      where: { id },
      relations: ['seller'],
    });
    if (!listing) throw new NotFoundException('Listing not found.');
    return listing;
  }

  assertOwner(listing: Listing, sellerId: string) {
    if (listing.sellerId !== sellerId) {
      throw new ForbiddenException('Only the seller can manage this listing.');
    }
  }

  present(l: Listing, withSeller: boolean) {
    const base = {
      id: l.id,
      title: l.title,
      description: l.description,
      priceKobo: l.priceKobo,
      currency: l.currency,
      kind: l.kind,
      category: l.category,
      imageUrl: l.imageUrl,
      status: l.status,
      salesCount: l.salesCount,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    };
    if (!withSeller) return { ...base, sellerId: l.sellerId };
    const { passwordHash: _omit, ...seller } =
      (l.seller as unknown as Record<string, unknown>) ?? {};
    void _omit;
    return { ...base, sellerId: l.sellerId, seller };
  }
}
