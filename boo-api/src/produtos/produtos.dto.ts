import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class TamanhoProdutoDto {
  @IsString()
  @IsIn(['P', 'M', 'G', 'U', 'Tamanho Único'])
  label!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000)
  estoque!: number;
}

class ImagemProdutoDto {
  @IsString()
  @MaxLength(500)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cor?: string;
}

export class SalvarProdutoDto {
  @IsString()
  @MaxLength(160)
  nome!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  descricao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sku?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999.99)
  preco!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000000)
  estoque?: number;

  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => TamanhoProdutoDto)
  tamanhos!: TamanhoProdutoDto[];

  @IsString()
  @MaxLength(120)
  categoria!: string;

  @IsOptional()
  @IsBoolean()
  esgotado?: boolean;

  @IsOptional()
  @IsBoolean()
  ultimaPeca?: boolean;

  @IsOptional()
  @IsBoolean()
  oculto?: boolean;

  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  cores!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imgUrl?: string;

  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => ImagemProdutoDto)
  imagens!: ImagemProdutoDto[];

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @Max(1000)
  pesoKg!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(300)
  alturaCm!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(300)
  larguraCm!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(300)
  comprimentoCm!: number;
}
