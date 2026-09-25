import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity';
import { Transaction } from '../entities/transaction.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private reviews: Repository<Review>,
    @InjectRepository(Transaction) private txs: Repository<Transaction>,
    @InjectRepository(User) private users: Repository<User>,
  ) {}

  /** Rate the other side of a completed deal. One review per side. */
  async create(userId: string, transactionId: string, rating: number, comment?: string) {
    const tx = await this.txs.findOne({ where: { id: transactionId } });
    if (!tx) throw new NotFoundException('Transaction not found.');
    if (tx.buyerId !== userId && tx.sellerId !== userId) {
      throw new ForbiddenException('You are not part of this transaction.');
    }
    if (tx.status !== 'COMPLETED') {
      throw new BadRequestException('You can only review completed deals.');
    }
    const existing = await this.reviews.findOne({ where: { transactionId, reviewerId: userId } });
    if (existing) throw new BadRequestException('You already reviewed this deal.');
    const revieweeId = tx.buyerId === userId ? tx.sellerId : tx.buyerId;
    const saved = await this.reviews.save(
      this.reviews.create({
        transactionId,
        reviewerId: userId,
        revieweeId,
        rating,
        comment: comment ?? null,
      }),
    );
    return this.present(saved);
  }

  /** Public: reviews received by a username, with average. */
  async forUser(username: string) {
    const user = await this.users.findOne({ where: { username: username.toLowerCase() } });
    if (!user) throw new NotFoundException('User not found.');
    const rows = await this.reviews.find({
      where: { revieweeId: user.id },
      relations: ['reviewer'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
    const count = await this.reviews.count({ where: { revieweeId: user.id } });
    const avgRaw = await this.reviews
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .where('r.revieweeId = :id', { id: user.id })
      .getRawOne<{ avg: string | null }>();
    return {
      reviews: rows.map((r) => this.present(r)),
      count,
      avg: avgRaw?.avg == null ? null : Math.round(Number(avgRaw.avg) * 10) / 10,
    };
  }

  /** Participants: both sides' reviews for one deal. */
  async forTransaction(txId: string, userId: string) {
    const tx = await this.txs.findOne({ where: { id: txId } });
    if (!tx) throw new NotFoundException('Transaction not found.');
    if (tx.buyerId !== userId && tx.sellerId !== userId) {
      throw new ForbiddenException('You are not part of this transaction.');
    }
    const rows = await this.reviews.find({
      where: { transactionId: txId },
      relations: ['reviewer'],
      order: { createdAt: 'ASC' },
    });
    return rows.map((r) => ({ ...this.present(r), mine: r.reviewerId === userId }));
  }

  private present(r: Review) {
    const reviewer = (r as { reviewer?: { name?: string; username?: string } }).reviewer;
    return {
      id: r.id,
      transactionId: r.transactionId,
      reviewerId: r.reviewerId,
      revieweeId: r.revieweeId,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      reviewerName: reviewer?.name,
      reviewerUsername: reviewer?.username,
    };
  }
}
