import { BadRequestException } from '@nestjs/common';
import { InfinitePayService } from './infinitepay.service';

describe('InfinitePayService', () => {
  const handleAnterior = process.env.INFINITEPAY_HANDLE;
  const pedido = {
    id: 'pedido-1',
    numero: 101,
    usuarioId: 'usuario-1',
    total: 129.9,
    status: 'aguardando_pagamento',
    formaPagamento: 'infinitepay',
    estoqueRestaurado: false,
    pagamento: { status: 'aguardando_pagamento' },
  };

  afterEach(() => {
    jest.restoreAllMocks();
    if (handleAnterior === undefined) delete process.env.INFINITEPAY_HANDLE;
    else process.env.INFINITEPAY_HANDLE = handleAnterior;
  });

  beforeEach(() => {
    process.env.INFINITEPAY_HANDLE = 'boo-teste';
  });

  function respostaPagamento(amount = 12990) {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(
        JSON.stringify({
          success: true,
          paid: true,
          amount,
          capture_method: 'pix',
        }),
      ),
    } as any);
  }

  function criarService(pagamentoAtual = pedido.pagamento) {
    const pedidoAtual = { ...pedido, pagamento: pagamentoAtual };
    const atualizado = {
      ...pedidoAtual,
      status: 'pago',
      formaPagamento: 'pix',
      pagamento: { status: 'pago', transactionNsu: 'transacao-1' },
    };
    const tx = {
      pedido: {
        findUnique: jest.fn().mockResolvedValue(pedidoAtual),
        update: jest.fn().mockResolvedValue(atualizado),
      },
    };
    const prisma = {
      pedido: { findUnique: jest.fn().mockResolvedValue(pedido) },
      $transaction: jest.fn((callback: (cliente: any) => unknown) =>
        callback(tx),
      ),
    };
    const emails = {
      pagamentoConfirmado: jest.fn().mockResolvedValue(true),
      novoPedidoPagoAdmin: jest.fn().mockResolvedValue(true),
      pagamentoAposCancelamento: jest.fn().mockResolvedValue(true),
    };
    return {
      service: new InfinitePayService(prisma as any, emails as any),
      prisma,
      emails,
      tx,
    };
  }

  it('confirma na API, confere o valor e avisa cliente e administrador', async () => {
    respostaPagamento();
    const { service, emails } = criarService();

    const resultado = await service.confirmar({
      order_nsu: 'pedido-1',
      transaction_nsu: 'transacao-1',
      slug: 'fatura-1',
    });

    expect(resultado).toMatchObject({
      pago: true,
      pedidoId: 'pedido-1',
      status: 'pago',
    });
    expect(emails.pagamentoConfirmado).toHaveBeenCalledTimes(1);
    expect(emails.novoPedidoPagoAdmin).toHaveBeenCalledTimes(1);
  });

  it('nao envia os e-mails novamente em webhook duplicado', async () => {
    respostaPagamento();
    const { service, emails } = criarService({ status: 'pago' });

    await service.confirmar({
      order_nsu: 'pedido-1',
      transaction_nsu: 'transacao-1',
      invoice_slug: 'fatura-1',
    });

    expect(emails.pagamentoConfirmado).not.toHaveBeenCalled();
    expect(emails.novoPedidoPagoAdmin).not.toHaveBeenCalled();
  });

  it('recusa a confirmacao quando o valor pago diverge do pedido', async () => {
    respostaPagamento(9999);
    const { service, prisma, emails } = criarService();

    await expect(
      service.confirmar({
        order_nsu: 'pedido-1',
        transaction_nsu: 'transacao-1',
        slug: 'fatura-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(emails.pagamentoConfirmado).not.toHaveBeenCalled();
  });

  it('repete a transacao quando duas confirmacoes concorrem no banco', async () => {
    respostaPagamento();
    const { service, prisma, emails, tx } = criarService();
    prisma.$transaction
      .mockRejectedValueOnce({ code: 'P2034' })
      .mockImplementationOnce((callback: (cliente: any) => unknown) =>
        callback(tx),
      );

    const resultado = await service.confirmar({
      order_nsu: 'pedido-1',
      transaction_nsu: 'transacao-1',
      slug: 'fatura-1',
    });

    expect(resultado.pago).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(emails.novoPedidoPagoAdmin).toHaveBeenCalledTimes(1);
  });

  it('registra webhooks duplicados de forma idempotente', async () => {
    const prisma = {
      pedido: {
        findUnique: jest.fn().mockResolvedValue({ id: 'pedido-webhook-1' }),
      },
      paymentWebhookEvent: { upsert: jest.fn().mockResolvedValue({}) },
    };
    const service = new InfinitePayService(prisma as any, {} as any);
    jest.spyOn(service, 'processarWebhooks').mockResolvedValue(undefined);
    const payload = {
      order_nsu: 'pedido-webhook-1',
      transaction_nsu: 'transacao-webhook-1',
      invoice_slug: 'fatura-webhook-1',
    };

    await service.receberWebhook(payload);
    await service.receberWebhook(payload);

    expect(prisma.paymentWebhookEvent.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.paymentWebhookEvent.upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { transactionNsu: 'transacao-webhook-1' },
        update: {},
      }),
    );
  });
});
