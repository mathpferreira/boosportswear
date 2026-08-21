import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class ItemPedidoDto {
  @IsUUID()
  id!: string;

  @IsString()
  @IsIn(['P', 'M', 'G', 'U', 'Tamanho Único'])
  tamanhoEscolhido!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  quantidade!: number;
}

class EntregaPedidoDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nome!: string;

  @IsEmail()
  @MaxLength(160)
  email!: string;

  @IsString()
  @Matches(/^\+?\d{10,13}$/)
  telefone!: string;

  @IsString()
  @Matches(/^\d{5}-?\d{3}$/)
  cep!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(180)
  rua!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  numero!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  complemento?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  bairro!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  cidade!: string;

  @IsString()
  @Matches(/^[A-Za-z]{2}$/)
  estado!: string;
}

class FretePedidoDto {
  @IsString()
  @MaxLength(120)
  codigo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  nome?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000)
  valor?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  prazo?: string;

  @IsString()
  @Matches(/^\d{8}$/)
  cepDestino!: string;

  @IsOptional()
  @IsBoolean()
  valorPendente?: boolean;
}

class CupomPedidoDto {
  @IsString()
  @MaxLength(40)
  codigo!: string;
}

export class CriarPedidoDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ItemPedidoDto)
  itens!: ItemPedidoDto[];

  @ValidateNested()
  @Type(() => EntregaPedidoDto)
  entrega!: EntregaPedidoDto;

  @IsString()
  @IsIn(['infinitepay'])
  formaPagamento!: string;

  @ValidateNested()
  @Type(() => FretePedidoDto)
  frete!: FretePedidoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CupomPedidoDto)
  cupom?: CupomPedidoDto;
}

export class StatusPedidoDto {
  @IsString()
  @IsIn([
    'aguardando_pagamento',
    'pendente',
    'pago',
    'em_preparacao',
    'enviado',
    'entregue',
    'cancelado',
    'pagamento_apos_cancelamento',
  ])
  status!: string;
}
