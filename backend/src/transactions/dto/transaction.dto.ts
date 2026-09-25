import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class DeliverDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  @Transform(({ value }) => String(value ?? '').trim())
  note: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  deliveryUrl?: string;
}

export class DisputeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  @Transform(({ value }) => String(value ?? '').trim())
  reason: string;
}

export class ResolveDisputeDto {
  @IsIn(['release', 'refund'], { message: 'Decision must be release or refund.' })
  decision: 'release' | 'refund';

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  @Transform(({ value }) => String(value ?? '').trim())
  note: string;
}

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  @Transform(({ value }) => String(value ?? '').trim())
  body: string;
}
