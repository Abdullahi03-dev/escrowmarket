import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @IsEmail({}, { message: 'Enter a valid email address.' })
  @MaxLength(254)
  @Transform(({ value }) => String(value ?? '').trim().toLowerCase())
  email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password: string;
}
