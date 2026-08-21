import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ListarUsuariosDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  busca?: string;

  @IsOptional()
  @IsIn(['recentes', 'antigos', 'nome', 'admin-first'])
  ordenacao?: string;
}

export class AtualizarRoleDto {
  @IsIn(['ADMIN', 'CLIENTE'])
  role!: 'ADMIN' | 'CLIENTE';
}
