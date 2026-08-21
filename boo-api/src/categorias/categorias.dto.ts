import { IsString, MaxLength, MinLength } from 'class-validator';

export class CategoriaDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nome!: string;
}
