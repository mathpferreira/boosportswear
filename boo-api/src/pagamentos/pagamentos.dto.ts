import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ConfirmarPagamentoDto {
  @IsString()
  @MinLength(10)
  @MaxLength(100)
  order_nsu!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(160)
  transaction_nsu!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  invoice_slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  receipt_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  capture_method?: string;
}

export class WebhookInfinitePayDto extends ConfirmarPagamentoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99999999999)
  amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99999999999)
  paid_amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  installments?: number;

  @IsOptional()
  @IsArray()
  items?: unknown[];
}
