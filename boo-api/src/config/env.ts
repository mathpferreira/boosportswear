const URL_KEYS = ['PUBLIC_SITE_URL', 'PUBLIC_API_URL'] as const;
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

function emailDoRemetente(valor: string) {
  if (EMAIL.test(valor)) return valor;
  const encontrado = valor.match(/^[^<>\r\n]{1,100}<([^<>\r\n]+)>$/);
  return encontrado && EMAIL.test(encontrado[1]) ? encontrado[1] : '';
}

export function validarAmbiente() {
  const erros: string[] = [];
  const nodeEnv = process.env.NODE_ENV?.trim() || '';
  const production = nodeEnv === 'production';
  const databaseUrl = process.env.DATABASE_URL?.trim() || '';

  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    erros.push('NODE_ENV deve ser development, test ou production');
  }

  if (
    !databaseUrl.startsWith('postgresql://') &&
    !databaseUrl.startsWith('postgres://')
  ) {
    erros.push('DATABASE_URL deve iniciar com postgresql:// ou postgres://');
  }

  const jwtSecret = process.env.JWT_SECRET?.trim() || '';
  if (
    production &&
    (jwtSecret.length < 32 ||
      /troque|change|example|placeholder/i.test(jwtSecret))
  ) {
    erros.push('JWT_SECRET deve ter pelo menos 32 caracteres em producao');
  }

  for (const chave of URL_KEYS) {
    const valor = process.env[chave]?.trim() || '';
    if (production) {
      try {
        const url = new URL(valor);
        if (
          url.protocol !== 'https:' ||
          url.origin !== valor.replace(/\/$/, '')
        ) {
          throw new Error();
        }
      } catch {
        erros.push(chave + ' deve ser uma origem HTTPS valida em producao');
      }
    }
  }

  const origem = String(process.env.FRENET_CEP_ORIGEM || '').replace(/\D/g, '');
  if (production && origem.length !== 8)
    erros.push('FRENET_CEP_ORIGEM deve conter 8 digitos');

  const obrigatoriasEmProducao = [
    'CORS_ORIGINS',
    'FRENET_TOKEN',
    'INFINITEPAY_HANDLE',
    'RESEND_API_KEY',
    'EMAIL_FROM',
    'EMAIL_ADMIN',
  ];
  for (const chave of obrigatoriasEmProducao) {
    if (production && !process.env[chave]?.trim())
      erros.push(chave + ' e obrigatoria em producao');
  }

  const origens = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (
    production &&
    origens.some((origemPermitida) => {
      try {
        const url = new URL(origemPermitida);
        return (
          url.protocol !== 'https:' ||
          url.origin !== origemPermitida.replace(/\/$/, '')
        );
      } catch {
        return true;
      }
    })
  ) {
    erros.push('Todas as CORS_ORIGINS devem ser origens HTTPS validas');
  }

  const siteUrl = process.env.PUBLIC_SITE_URL?.trim().replace(/\/$/, '') || '';
  if (production && !origens.includes(siteUrl)) {
    erros.push('CORS_ORIGINS deve incluir PUBLIC_SITE_URL');
  }

  if (
    production &&
    !['127.0.0.1', '::1', 'localhost'].includes(
      process.env.API_HOST?.trim() || '',
    )
  ) {
    erros.push('API_HOST deve manter a API restrita ao loopback em producao');
  }

  const emailAdmin = process.env.EMAIL_ADMIN?.trim() || '';
  const emailFrom = process.env.EMAIL_FROM?.trim() || '';
  if (production && !EMAIL.test(emailAdmin)) {
    erros.push('EMAIL_ADMIN deve ser um e-mail valido');
  }
  if (production && !emailDoRemetente(emailFrom)) {
    erros.push(
      'EMAIL_FROM deve usar email@dominio.com ou Nome <email@dominio.com>',
    );
  }

  if (
    production &&
    !/^re_[A-Za-z0-9_-]{20,}$/.test(process.env.RESEND_API_KEY?.trim() || '')
  ) {
    erros.push('RESEND_API_KEY nao possui o formato esperado');
  }

  if (production && (process.env.FRENET_TOKEN?.trim().length || 0) < 20) {
    erros.push('FRENET_TOKEN nao possui o formato esperado');
  }

  if (
    production &&
    !/^[A-Za-z0-9._-]{2,80}$/.test(process.env.INFINITEPAY_HANDLE?.trim() || '')
  ) {
    erros.push('INFINITEPAY_HANDLE deve ser informado sem o caractere $');
  }

  if (
    production &&
    !/^\d{4}-\d{2}-\d{2}$/.test(process.env.TERMS_VERSION?.trim() || '')
  ) {
    erros.push('TERMS_VERSION deve usar o formato AAAA-MM-DD');
  }

  if (erros.length) {
    throw new Error(
      'Configuracao de ambiente invalida:\n- ' + erros.join('\n- '),
    );
  }
}
