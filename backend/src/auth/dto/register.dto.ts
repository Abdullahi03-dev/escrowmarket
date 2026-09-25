import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Transform(({ value }) => String(value ?? '').trim())
  name: string;

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username may only contain letters, numbers and underscores.',
  })
  @Transform(({ value }) => String(value ?? '').trim().toLowerCase())
  username: string;

  @IsEmail({}, { message: 'Enter a valid email address.' })
  @MaxLength(254)
  @Transform(({ value }) => String(value ?? '').trim().toLowerCase())
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  @MaxLength(128)
  password: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}
