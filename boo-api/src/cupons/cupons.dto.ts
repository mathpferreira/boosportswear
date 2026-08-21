import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CriarCupomDto {
  @IsString()
  @MaxLength(120)
  nome!: string;

  @IsString()
  @MaxLength(40)
  codigo!: string;

  @IsIn(['PERCENTUAL', 'FIXO'])
  tipo!: 'PERCENTUAL' | 'FIXO';

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999.99)
  valor!: number;

  @IsOptional()
  @IsDateString()
  expiraEm?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000000)
  usosMaximos?: number | null;
}

export class AtualizarCupomDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  codigo?: string;

  @IsOptional()
  @IsIn(['PERCENTUAL', 'FIXO'])
  tipo?: 'PERCENTUAL' | 'FIXO';

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999.99)
  valor?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsDateString()
  expiraEm?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000000)
  usosMaximos?: number | null;
}

export class ValidarCupomDto {
  @IsString()
  @MaxLength(40)
  codigo!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999999.99)
  subtotal!: number;
}
