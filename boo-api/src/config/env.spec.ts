import { validarAmbiente } from './env';

const ambienteValido = {
  NODE_ENV: 'production',
  DATABASE_URL:
    'postgresql://boo_app:senha-segura@127.0.0.1:5432/boo_db?schema=public',
  JWT_SECRET: 'uma-chave-segura-com-mais-de-32-caracteres',
  API_HOST: '127.0.0.1',
  CORS_ORIGINS: 'https://boosportwear.com,https://www.boosportwear.com',
  PUBLIC_SITE_URL: 'https://boosportwear.com',
  PUBLIC_API_URL: 'https://boosportwear.com',
  FRENET_CEP_ORIGEM: '03133000',
  FRENET_TOKEN: 'token-frenet-comprido-para-teste',
  INFINITEPAY_HANDLE: 'boo-sportwear',
  RESEND_API_KEY: 're_chave_valida_para_ambiente_de_teste',
  EMAIL_FROM: 'BOO Sportwear <pedidos@boosportwear.com>',
  EMAIL_ADMIN: 'admin@boosportwear.com',
  TERMS_VERSION: '2026-08-20',
};

describe('validarAmbiente', () => {
  beforeEach(() => {
    jest.replaceProperty(process, 'env', { ...ambienteValido });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('aceita o schema public', () => {
    expect(() => validarAmbiente()).not.toThrow();
  });

  it('rejeita um schema PostgreSQL incorreto', () => {
    process.env.DATABASE_URL =
      'postgresql://boo_app:senha-segura@127.0.0.1:5432/boo_db?schema=publ%3E';

    expect(() => validarAmbiente()).toThrow(
      'DATABASE_URL deve usar ?schema=public',
    );
  });
});
