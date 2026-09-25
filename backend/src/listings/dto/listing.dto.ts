import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { LISTING_CATEGORIES } from '../../entities/listing.entity';

export class CreateListingDto {
  @IsString()
  @MinLength(4)
  @MaxLength(140)
  @Transform(({ value }) => String(value ?? '').trim())
  title: string;

  @IsString()
  @MinLength(20, { message: 'Description must be at least 20 characters.' })
  @MaxLength(5000)
  @Transform(({ value }) => String(value ?? '').trim())
  description: string;

  /** Price in Naira — converted to kobo server-side. */
  @IsInt()
  @Min(100, { message: 'Minimum price is ₦100.' })
  @Max(100_000_000)
  priceNaira: number;

  @IsIn(['PRODUCT', 'SERVICE'])
  kind: 'PRODUCT' | 'SERVICE';

  @IsIn([...LISTING_CATEGORIES] as string[])
  category: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @IsNotEmpty()
  imageUrl?: string;
}

export class UpdateListingDto {
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(140)
  @Transform(({ value }) =>
    value == null ? value : String(value).trim() || undefined,
  )
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  @Transform(({ value }) =>
    value == null ? value : String(value).trim() || undefined,
  )
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(100_000_000)
  priceNaira?: number;

  @IsOptional()
  @IsIn([...LISTING_CATEGORIES] as string[])
  category?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  imageUrl?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'PAUSED', 'ARCHIVED'])
  status?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
}
