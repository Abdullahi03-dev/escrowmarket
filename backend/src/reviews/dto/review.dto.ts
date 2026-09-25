import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateReviewDto {
  @IsUUID()
  transactionId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) =>
    value == null ? value : String(value).trim() || undefined,
  )
  comment?: string;
}
