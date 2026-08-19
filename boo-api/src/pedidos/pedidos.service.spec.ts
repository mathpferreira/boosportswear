import { PedidosService } from './pedidos.service';

describe('PedidosService - cancelamento', () => {
  const pedidoPendente = {
    id: 'pedido-1',
    numero: 101,
    usuarioId: 'usuario-1',
    status: 'aguardando_pagamento',
    estoqueRestaurado: false,
    pagamento: { status: 'aguardando_pagamento' },
    cupom: null,
    itens: [{ id: 'produto-1', quantidade: 2, tamanhoEscolhido: 'M' }],
  };

  function criarService(tx: any) {
    const prisma = {
      $transaction: jest.fn((callback: (cliente: any) => unknown) => callback(tx)),
    };
    const emails = { pedidoCancelado: jest.fn().mockResolvedValue(true) };
    const service = new PedidosService(
      prisma as any,
      {} as any,
      {} as any,
      {} as any,
      emails as any,
    );
    return { service, prisma, emails };
  }

  it('devolve o estoque total e o estoque do tamanho selecionado', async () => {
    const pedidoCancelado = { ...pedidoPendente, status: 'cancelado', estoqueRestaurado: true };
    const tx = {
      pedido: {
        findUnique: jest.fn().mockResolvedValue(pedidoPendente),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue(pedidoCancelado),
      },
      produto: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'produto-1',
          tamanhos: [{ label: 'P', estoque: 1 }, { label: 'M', estoque: 3 }],
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      cupom: { updateMany: jest.fn() },
    };
    const { service, emails } = criarService(tx);

    const resultado = await service.cancelar('pedido-1', 'cliente', 'usuario-1');

    expect(tx.produto.update).toHaveBeenCalledWith({
      where: { id: 'produto-1' },
      data: {
        estoque: { increment: 2 },
        tamanhos: [{ label: 'P', estoque: 1 }, { label: 'M', estoque: 5 }],
        esgotado: false,
      },
    });
    expect(resultado.estoqueDevolvido).toBe(true);
    expect(emails.pedidoCancelado).toHaveBeenCalledTimes(1);
  });

  it('nao devolve o estoque novamente quando o pedido ja esta cancelado', async () => {
    const tx = {
      pedido: {
        findUnique: jest.fn().mockResolvedValue({
          ...pedidoPendente,
          status: 'cancelado',
          estoqueRestaurado: true,
        }),
      },
      produto: { update: jest.fn() },
    };
    const { service, emails } = criarService(tx);

    const resultado = await service.cancelar('pedido-1', 'admin');

    expect(tx.produto.update).not.toHaveBeenCalled();
    expect(resultado.estoqueDevolvido).toBe(false);
    expect(emails.pedidoCancelado).not.toHaveBeenCalled();
  });
});
