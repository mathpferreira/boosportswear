import { BadRequestException } from '@nestjs/common';
import { EmailsService } from './emails.service';

describe('EmailsService - modelos personalizados', () => {
  const resendAnterior = process.env.RESEND_API_KEY;
  const remetenteAnterior = process.env.EMAIL_FROM;

  afterEach(() => {
    jest.restoreAllMocks();
    if (resendAnterior === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = resendAnterior;
    if (remetenteAnterior === undefined) delete process.env.EMAIL_FROM;
    else process.env.EMAIL_FROM = remetenteAnterior;
  });

  function criarService() {
    const prisma = {
      configuracao: {
        findFirst: jest.fn().mockResolvedValue({ id: 'config-1' }),
        create: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      emailOutbox: {
        create: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
        findUnique: jest.fn().mockResolvedValue({
          id: 'outbox-1',
          destinatario: 'cliente@example.com',
          assunto: 'Teste de e-mail - BOO Sportwear',
          html: '<p>Teste</p>',
          status: 'PENDING',
          tentativas: 0,
          proximaTentativa: new Date(0),
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    return { service: new EmailsService(prisma as any), prisma };
  }

  it('salva assunto e corpo personalizados usando variaveis permitidas', async () => {
    const { service, prisma } = criarService();

    const resultado = await service.salvarTemplates({
      pagamento_confirmado: {
        assunto: 'Pedido {{pedido}} aprovado',
        corpo: 'Ola, {{nome}}. Seu pedido foi confirmado.',
        ativo: true,
      },
    });

    expect(resultado.pagamento_confirmado.assunto).toContain('{{pedido}}');
    expect(prisma.configuracao.update).toHaveBeenCalledTimes(1);
  });

  it('impede remover o link dos e-mails essenciais', async () => {
    const { service } = criarService();

    await expect(
      service.salvarTemplates({
        verificar_conta: {
          assunto: 'Confirme sua conta',
          corpo: 'Mensagem sem o link necessario.',
          ativo: true,
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('recusa variaveis desconhecidas', async () => {
    const { service } = criarService();

    await expect(
      service.salvarTemplates({
        teste: {
          assunto: 'Teste',
          corpo: 'Valor {{variavel_inexistente}}',
          ativo: true,
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('usa uma chave idempotente ao enviar pelo Resend', async () => {
    process.env.RESEND_API_KEY = 're_12345678901234567890';
    process.env.EMAIL_FROM = 'BOO Sportwear <pedidos@boosportwear.com>';
    const requisicao = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('{"id":"email-resend-1"}'),
    } as any);
    const { service } = criarService();

    const resultado = await service.enviarTeste('cliente@example.com');
    const opcoes = requisicao.mock.calls[0][1];

    expect(resultado).toEqual({
      sucesso: true,
      destinatario: 'cliente@example.com',
    });
    expect(requisicao.mock.calls[0][0]).toBe('https://api.resend.com/emails');
    expect(new Headers(opcoes?.headers).get('Idempotency-Key')).toBe(
      'outbox-1',
    );
  });
});
