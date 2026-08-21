import { Transform } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

const SENHA_FORTE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,128}$/;

export class CadastroDto {
  @Transform(({ value }) => String(value || '').trim())
  @IsString()
  @Length(2, 120)
  nome!: string;

  @Transform(({ value }) =>
    String(value || '')
      .trim()
      .toLowerCase(),
  )
  @IsEmail()
  @Length(5, 254)
  email!: string;

  @IsString()
  @Matches(SENHA_FORTE, {
    message:
      'A senha deve ter ao menos 10 caracteres, com maiuscula, minuscula e numero.',
  })
  senha!: string;

  @IsBoolean()
  @Equals(true, { message: 'E necessario aceitar as Politicas da Loja.' })
  aceitouTermos!: boolean;

  @Transform(({ value }) => String(value || '').trim())
  @IsString()
  @Length(1, 40)
  versaoTermos!: string;

  @IsOptional()
  @IsBoolean()
  aceitouMarketing?: boolean;
}

export class LoginDto {
  @Transform(({ value }) =>
    String(value || '')
      .trim()
      .toLowerCase(),
  )
  @IsEmail()
  @Length(5, 254)
  email!: string;

  @IsString()
  @Length(1, 128)
  senha!: string;
}

export class EmailDto {
  @Transform(({ value }) =>
    String(value || '')
      .trim()
      .toLowerCase(),
  )
  @IsEmail()
  @Length(5, 254)
  email!: string;
}

export class TokenDto {
  @Transform(({ value }) => String(value || '').trim())
  @IsString()
  @Length(32, 300)
  token!: string;
}

export class RedefinirSenhaDto extends TokenDto {
  @IsString()
  @Matches(SENHA_FORTE, {
    message:
      'A senha deve ter ao menos 10 caracteres, com maiuscula, minuscula e numero.',
  })
  novaSenha!: string;
}
