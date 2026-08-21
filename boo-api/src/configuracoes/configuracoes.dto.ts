import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

class FreteConfiguracaoDto {
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsBoolean()
  motoboyAtivo?: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^\d{8}$/)
  cepOrigem?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @Max(1000)
  pesoKg!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(300)
  alturaCm!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(300)
  larguraCm!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(300)
  comprimentoCm!: number;
}

export class AtualizarConfiguracaoDto {
  @IsOptional()
  @IsBoolean()
  lojaAberta?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  fraseTopo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  instagramUrl?: string;

  @IsOptional()
  @ValidateIf((_obj, valor) => valor !== '')
  @IsEmail()
  @MaxLength(160)
  emailSuporte?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FreteConfiguracaoDto)
  frete?: FreteConfiguracaoDto;
}
