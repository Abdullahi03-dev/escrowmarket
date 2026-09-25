import { IsString, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class SaveRecipientDto {
  /** Nigerian NUBAN account number — exactly 10 digits. */
  @IsString()
  @Matches(/^[0-9]{10}$/, { message: 'Account number must be exactly 10 digits.' })
  accountNumber: string;

  /** Paystack bank code (from GET /payouts/banks). */
  @IsString()
  @MaxLength(16)
  @Transform(({ value }) => String(value ?? '').trim())
  bankCode: string;
}

export class ResolveAccountDto {
  @IsString()
  @Matches(/^[0-9]{10}$/, { message: 'Account number must be exactly 10 digits.' })
  accountNumber: string;

  @IsString()
  @MaxLength(16)
  @Transform(({ value }) => String(value ?? '').trim())
  bankCode: string;
}
