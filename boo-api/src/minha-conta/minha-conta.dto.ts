import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

class EnderecoContaDto {
  @IsOptional()
  @IsString()
  @ValidateIf((_obj, valor) => valor !== '')
  @Matches(/^\d{5}-?\d{3}$/)
  cep?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  rua?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  numero?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  complemento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  bairro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  cidade?: string;

  @IsOptional()
  @IsString()
  @ValidateIf((_obj, valor) => valor !== '')
  @Matches(/^[A-Za-z]{2}$/)
  estado?: string;
}

class PreferenciasContaDto {
  @IsOptional()
  @IsBoolean()
  novidadesEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  statusPedidoEmail?: boolean;
}

export class AtualizarContaDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nome?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  senhaAtual?: string;

  @IsOptional()
  @IsString()
  @ValidateIf((_obj, valor) => valor !== '')
  @Matches(/^\+?\d{10,13}$/)
  telefone?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => EnderecoContaDto)
  enderecoPadrao?: EnderecoContaDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PreferenciasContaDto)
  preferenciasConta?: PreferenciasContaDto;
}
