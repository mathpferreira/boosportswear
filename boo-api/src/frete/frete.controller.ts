import { Type } from 'class-transformer';
import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { FreteService } from './frete.service';

class ItemCotacaoDto {
  @IsUUID()
  id!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  quantidade!: number;

  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  preco?: number;
}

class CotacaoFreteDto {
  @IsString()
  @Matches(/^\d{5}-?\d{3}$/)
  cep!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ItemCotacaoDto)
  itens!: ItemCotacaoDto[];
}

@Controller('frete')
export class FreteController {
  constructor(private readonly freteService: FreteService) {}

  @Post('cotar')
  @Throttle({ default: { limit: 20, ttl: 60 * 1000 } })
  cotar(@Body() dados: CotacaoFreteDto) {
    return this.freteService.cotar({
      cep: dados.cep,
      subtotal: Number(dados.subtotal || 0),
      itens: dados.itens,
    });
  }
}
