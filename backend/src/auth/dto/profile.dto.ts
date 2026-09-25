import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
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
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username may only contain letters, numbers and underscores.',
  })
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
  avatarUrl?: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  @MaxLength(128)
  newPassword: string;
}
