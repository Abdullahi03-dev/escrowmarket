import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import type { UserRole } from '../../entities/user.entity';

export class OnboardingDto {
  @IsIn(['BUYER', 'SELLER', 'BOTH'], {
    message: 'Role must be BUYER, SELLER or BOTH.',
  })
  role: UserRole;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) =>
    value == null ? value : String(value).trim() || undefined,
  )
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/)
  @Transform(({ value }) =>
    value == null ? value : String(value).trim().toLowerCase() || undefined,
  )
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  @Transform(({ value }) =>
    value == null ? value : String(value).trim() || undefined,
  )
  bio?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @IsNotEmpty()
  avatarUrl?: string;
}
