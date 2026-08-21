import {
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PedidosService } from './pedidos.service';

describe('PedidosService - criacao segura', () => {
  function criarCenario(
    opcoes: { lojaAberta?: boolean; emailVerificado?: boolean } = {},
  ) {
    const produto = {
      id: '11111111-1111-4111-8111-111111111111',
      nome: 'Conjunto BOO',
      preco: 100,
      estoque: 5,
      tamanhos: [{ label: 'M', estoque: 5 }],
      oculto: false,
      esgotado: false,
      excluidoEm: null,
      imgUrl: '/uploads/produtos/teste.webp',
      pesoKg: 0.5,
      alturaCm: 8,
      larguraCm: 20,
      comprimentoCm: 28,
    };
    const pedido = {
      id: 'pedido-reservado',
      numero: 150,
      usuarioId: 'usuario-1',
      total: 125,
      status: 'aguardando_pagamento',
      expiraEmPagamento: new Date(Date.now() + 30 * 60_000),
      entrega: { nome: 'Cliente Teste', email: 'cliente@teste.com' },
    };
    const tx = {
      produto: {
        findUnique: jest.fn().mockResolvedValue(produto),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      pedido: { create: jest.fn().mockResolvedValue(pedido) },
      cupom: { findUnique: jest.fn(), update: jest.fn() },
    };
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          emailVerifiedAt: opcoes.emailVerificado === false ? null : new Date(),
          email: 'cliente@example.com',
        }),
      },
      configuracao: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ lojaAberta: opcoes.lojaAberta !== false }),
      },
      produto: { findMany: jest.fn().mockResolvedValue([produto]) },
      pedido: { update: jest.fn().mockResolvedValue(pedido) },
      $transaction: jest.fn((callback: (cliente: any) => unknown) =>
        callback(tx),
      ),
    };
    const frete = {
      validarEnderecoEntrega: jest.fn().mockResolvedValue({
        nome: 'Cliente Teste',
        email: 'cliente@teste.com',
        telefone: '11999999999',
        cep: '78000000',
        rua: 'Rua Teste',
        numero: '10',
        bairro: 'Centro',
        cidade: 'Cuiaba',
        estado: 'MT',
      }),
      validarOpcao: jest
        .fn()
        .mockResolvedValue({ codigo: 'PAC', nome: 'PAC', valor: 25 }),
    };
    const infinitePay = {
      criarCheckout: jest.fn().mockResolvedValue({
        checkoutUrl: 'https://checkout.infinitepay.com.br/teste',
        pagamento: { status: 'aguardando_pagamento' },
      }),
    };
    const emails = { pedidoAguardando: jest.fn().mockResolvedValue(true) };
    const service = new PedidosService(
      prisma as any,
      { validar: jest.fn() } as any,
      frete as any,
      infinitePay as any,
      emails as any,
    );
    return { service, prisma, tx, frete, infinitePay };
  }

  const dados = {
    itens: [
      {
        id: '11111111-1111-4111-8111-111111111111',
        tamanhoEscolhido: 'M',
        quantidade: 1,
      },
    ],
    entrega: {
      nome: 'Cliente Teste',
      email: 'cliente@teste.com',
      telefone: '11999999999',
      cep: '78000000',
      rua: 'Rua Teste',
      numero: '10',
      bairro: 'Centro',
      cidade: 'Cuiaba',
      estado: 'MT',
    },
    formaPagamento: 'infinitepay',
    frete: { codigo: 'PAC', valor: 0 },
    total: 1,
  };

  it('reserva o pedido antes de criar o checkout e recalcula o total no servidor', async () => {
    const { service, tx, infinitePay } = criarCenario();

    const resultado = await service.criar(
      dados,
      'usuario-1',
      'https://boosportwear.com',
    );

    expect(JSON.stringify(tx.pedido.create.mock.calls)).toContain(
      '"total":125',
    );
    expect(JSON.stringify(tx.pedido.create.mock.calls)).toContain(
      '"email":"cliente@example.com"',
    );
    expect(infinitePay.criarCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ total: 125 }),
    );
    expect(tx.pedido.create.mock.invocationCallOrder[0]).toBeLessThan(
      infinitePay.criarCheckout.mock.invocationCallOrder[0],
    );
    expect(resultado.checkoutUrl).toContain('infinitepay.com.br');
  });

  it('bloqueia novos pedidos quando a loja esta fechada', async () => {
    const { service, prisma, infinitePay } = criarCenario({
      lojaAberta: false,
    });

    await expect(
      service.criar(dados, 'usuario-1', 'https://boosportwear.com'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(infinitePay.criarCheckout).not.toHaveBeenCalled();
  });

  it('bloqueia compras de contas sem e-mail verificado', async () => {
    const { service, prisma } = criarCenario({ emailVerificado: false });

    await expect(
      service.criar(dados, 'usuario-1', 'https://boosportwear.com'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
