import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailsService } from '../emails/emails.service';
import { asRecord, errorMessage, safeString } from '../common/utils/value';

type CriarCheckoutInput = {
  orderNsu: string;
  total: number;
  entrega: {
    nome: string;
    email: string;
    telefone: string;
    cep: string;
    rua: string;
    bairro: string;
    numero: string;
    complemento?: string;
  };
  origemPublica: string;
};

type ConfirmarPagamentoInput = {
  order_nsu?: string;
  transaction_nsu?: string;
  slug?: string;
  invoice_slug?: string;
  receipt_url?: string;
  capture_method?: string;
};

@Injectable()
export class InfinitePayService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(InfinitePayService.name);
  private readonly apiUrl = 'https://api.checkout.infinitepay.io';
  private webhookTimer?: NodeJS.Timeout;
  private processandoWebhooks = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailsService: EmailsService,
  ) {}

  onModuleInit() {
    this.webhookTimer = setInterval(() => {
      void this.processarWebhooks().catch((erro) =>
        this.logger.error('Falha no processador de webhooks: ' + String(erro)),
      );
    }, 15_000);
    this.webhookTimer.unref?.();
    void this.processarWebhooks().catch((erro) =>
      this.logger.error(
        'Falha ao iniciar processador de webhooks: ' + String(erro),
      ),
    );
  }

  onModuleDestroy() {
    if (this.webhookTimer) clearInterval(this.webhookTimer);
  }

  private get handle() {
    const handle = process.env.INFINITEPAY_HANDLE?.trim();
    if (!handle || !/^[a-zA-Z0-9._-]{2,80}$/.test(handle)) {
      throw new ServiceUnavailableException(
        'INFINITEPAY_HANDLE nao configurada corretamente.',
      );
    }
    return handle;
  }

  private normalizarBaseUrl(valor: string, nome: string) {
    try {
      const url = new URL(valor);
      if (!['http:', 'https:'].includes(url.protocol))
        throw new Error('Protocolo invalido');
      return url.origin;
    } catch {
      throw new ServiceUnavailableException(
        `${nome} nao configurada para o checkout.`,
      );
    }
  }

  private async lerResposta(resposta: Response): Promise<unknown> {
    const texto = await resposta.text();
    try {
      return texto ? (JSON.parse(texto) as unknown) : null;
    } catch {
      return null;
    }
  }

  private telefoneComPais(telefone: unknown) {
    const numeros = safeString(telefone).replace(/\D/g, '');
    if (!numeros) return undefined;
    return `+${numeros.startsWith('55') ? numeros : `55${numeros}`}`;
  }

  private urlHttps(valor: unknown) {
    try {
      const url = new URL(safeString(valor));
      return url.protocol === 'https:' ? url.toString() : null;
    } catch {
      return null;
    }
  }

  private checkoutUrlSeguro(valor: unknown) {
    try {
      const url = new URL(safeString(valor));
      const host = url.hostname.toLowerCase();
      const permitido =
        url.protocol === 'https:' &&
        (host === 'infinitepay.com.br' ||
          host.endsWith('.infinitepay.com.br') ||
          host === 'infinitepay.io' ||
          host.endsWith('.infinitepay.io'));
      return permitido ? url.toString() : null;
    } catch {
      return null;
    }
  }

  async criarCheckout(input: CriarCheckoutInput) {
    const totalCentavos = Math.round(Number(input.total) * 100);
    if (!Number.isInteger(totalCentavos) || totalCentavos < 1) {
      throw new BadRequestException(
        'O total do pedido precisa ser maior que zero.',
      );
    }

    const siteUrl = this.normalizarBaseUrl(
      process.env.PUBLIC_SITE_URL?.trim() || input.origemPublica,
      'URL publica da loja',
    );
    const apiUrl = this.normalizarBaseUrl(
      process.env.PUBLIC_API_URL?.trim() || siteUrl,
      'URL publica da API',
    );
    const telefone = this.telefoneComPais(input.entrega.telefone);

    const payload = {
      handle: this.handle,
      order_nsu: input.orderNsu,
      redirect_url: `${siteUrl}/?pagamento=retorno`,
      webhook_url: `${apiUrl}/api/pagamentos/infinitepay/webhook`,
      items: [
        {
          quantity: 1,
          price: totalCentavos,
          description: `Pedido BOO ${input.orderNsu.slice(0, 8).toUpperCase()}`,
        },
      ],
      customer: {
        name: input.entrega.nome.trim(),
        email: input.entrega.email.trim(),
        ...(telefone ? { phone_number: telefone } : {}),
      },
      address: {
        cep: input.entrega.cep.replace(/\D/g, ''),
        street: input.entrega.rua.trim(),
        neighborhood: input.entrega.bairro.trim(),
        number: input.entrega.numero.trim(),
        complement: (input.entrega.complemento || '').trim(),
      },
    };

    let resposta: Response;
    try {
      resposta = await fetch(`${this.apiUrl}/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(12000),
      });
    } catch (erro: unknown) {
      this.logger.error(
        `Falha ao criar checkout InfinitePay: ${errorMessage(erro)}`,
      );
      throw new BadGatewayException(
        'Nao foi possivel abrir o pagamento agora. Tente novamente.',
      );
    }

    const retorno = await this.lerResposta(resposta);
    const checkoutUrl = this.checkoutUrlSeguro(asRecord(retorno).url);
    if (!resposta.ok || !checkoutUrl) {
      this.logger.error(
        `InfinitePay recusou o checkout (${resposta.status}): ${JSON.stringify(retorno)?.slice(0, 800)}`,
      );
      throw new BadGatewayException(
        'A InfinitePay nao conseguiu gerar o pagamento.',
      );
    }

    return {
      checkoutUrl,
      pagamento: {
        provedor: 'infinitepay',
        status: 'aguardando_pagamento',
        orderNsu: input.orderNsu,
        checkoutUrl,
        criadoEm: new Date().toISOString(),
      },
    };
  }

  async receberWebhook(input: ConfirmarPagamentoInput) {
    const orderNsu = String(input.order_nsu || '').trim();
    const transactionNsu = String(input.transaction_nsu || '').trim();
    const slug = String(input.slug || input.invoice_slug || '').trim();
    if (
      orderNsu.length < 10 ||
      orderNsu.length > 100 ||
      transactionNsu.length < 6 ||
      transactionNsu.length > 160 ||
      slug.length < 2 ||
      slug.length > 300
    ) {
      throw new BadRequestException('Webhook com identificadores invalidos.');
    }

    const pedido = await this.prisma.pedido.findUnique({
      where: { id: orderNsu },
      select: { id: true },
    });
    if (!pedido)
      throw new BadRequestException('Pedido do webhook nao encontrado.');
    await this.prisma.paymentWebhookEvent.upsert({
      where: { transactionNsu },
      update: {},
      create: {
        transactionNsu,
        payload: {
          order_nsu: orderNsu,
          transaction_nsu: transactionNsu,
          slug,
          invoice_slug: String(input.invoice_slug || '').slice(0, 300),
          receipt_url: String(input.receipt_url || '').slice(0, 1000),
          capture_method: String(input.capture_method || '').slice(0, 80),
        },
      },
    });
    void this.processarWebhooks().catch((erro) =>
      this.logger.error('Falha ao processar webhook recebido: ' + String(erro)),
    );
    return { success: true, message: null };
  }

  async processarWebhooks() {
    if (this.processandoWebhooks) return;
    this.processandoWebhooks = true;
    try {
      const eventos = await this.prisma.paymentWebhookEvent.findMany({
        where: {
          status: { in: ['PENDING', 'FAILED', 'PROCESSING'] },
          tentativas: { lt: 8 },
          proximaTentativa: { lte: new Date() },
        },
        orderBy: { criadoEm: 'asc' },
        take: 20,
      });

      for (const evento of eventos) {
        const reservado = await this.prisma.paymentWebhookEvent.updateMany({
          where: {
            id: evento.id,
            status: evento.status,
            tentativas: evento.tentativas,
          },
          data: {
            status: 'PROCESSING',
            proximaTentativa: new Date(Date.now() + 2 * 60_000),
          },
        });
        if (reservado.count !== 1) continue;

        try {
          const payload = asRecord(evento.payload);
          const resultado = await this.confirmar({
            order_nsu: safeString(payload.order_nsu),
            transaction_nsu: safeString(payload.transaction_nsu),
            slug: safeString(payload.slug),
            invoice_slug: safeString(payload.invoice_slug),
            receipt_url: safeString(payload.receipt_url),
            capture_method: safeString(payload.capture_method),
          });
          if (!resultado.pago)
            throw new Error('Pagamento ainda nao confirmado.');
          await this.prisma.paymentWebhookEvent.update({
            where: { id: evento.id },
            data: {
              status: 'PROCESSED',
              tentativas: { increment: 1 },
              ultimoErro: null,
              processadoEm: new Date(),
            },
          });
        } catch (erro: unknown) {
          const tentativas = evento.tentativas + 1;
          await this.prisma.paymentWebhookEvent.update({
            where: { id: evento.id },
            data: {
              status: 'FAILED',
              tentativas,
              ultimoErro: errorMessage(erro).slice(0, 1000),
              proximaTentativa: new Date(
                Date.now() + Math.min(60, Math.pow(2, tentativas)) * 60_000,
              ),
            },
          });
          this.logger.warn(
            'Webhook InfinitePay pendente de nova tentativa: ' +
              evento.transactionNsu.slice(0, 16),
          );
        }
      }
    } finally {
      this.processandoWebhooks = false;
    }
  }

  async confirmar(input: ConfirmarPagamentoInput, usuarioId?: string) {
    const orderNsu = String(input.order_nsu || '').trim();
    const transactionNsu = String(input.transaction_nsu || '').trim();
    const slug = String(input.slug || input.invoice_slug || '').trim();
    if (!orderNsu || !transactionNsu || !slug) {
      throw new BadRequestException(
        'Identificadores do pagamento incompletos.',
      );
    }

    const pedido = await this.prisma.pedido.findUnique({
      where: { id: orderNsu },
    });
    if (!pedido || (usuarioId && pedido.usuarioId !== usuarioId)) {
      throw new NotFoundException('Pedido nao encontrado.');
    }

    const pagamentoRegistrado = asRecord(pedido.pagamento);
    if (
      ['pago', 'pago_apos_cancelamento'].includes(
        safeString(pagamentoRegistrado.status),
      ) &&
      safeString(pagamentoRegistrado.transactionNsu) === transactionNsu
    ) {
      return {
        pago: true,
        pedidoId: pedido.id,
        numeroPedido: pedido.numero,
        status: pedido.status,
      };
    }

    let resposta: Response;
    try {
      resposta = await fetch(`${this.apiUrl}/payment_check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          handle: this.handle,
          order_nsu: orderNsu,
          transaction_nsu: transactionNsu,
          slug,
        }),
        signal: AbortSignal.timeout(10000),
      });
    } catch (erro: unknown) {
      this.logger.error(
        `Falha ao confirmar pagamento InfinitePay: ${errorMessage(erro)}`,
      );
      throw new BadGatewayException(
        'Nao foi possivel confirmar o pagamento agora.',
      );
    }

    const verificacao = asRecord(await this.lerResposta(resposta));
    if (!resposta.ok) {
      this.logger.error(
        `InfinitePay recusou a verificacao (${resposta.status}): ${JSON.stringify(verificacao)?.slice(0, 800)}`,
      );
      throw new BadGatewayException('A InfinitePay nao confirmou a transacao.');
    }

    if (verificacao.success !== true || verificacao.paid !== true) {
      return {
        pago: false,
        pedidoId: pedido.id,
        numeroPedido: pedido.numero,
        status: pedido.status,
      };
    }

    const totalEsperado = Math.round(Number(pedido.total) * 100);
    const totalConfirmado = Number(verificacao.amount);
    if (
      !Number.isInteger(totalConfirmado) ||
      totalConfirmado !== totalEsperado
    ) {
      this.logger.error(
        `Divergencia no pedido ${pedido.id}: esperado ${totalEsperado}, confirmado ${totalConfirmado}`,
      );
      throw new BadRequestException(
        'O valor confirmado nao corresponde ao total do pedido.',
      );
    }

    const captura = safeString(
      verificacao.capture_method,
      input.capture_method || '',
    ).toLowerCase();
    const registrarPagamento = () =>
      this.prisma.$transaction(
        async (tx) => {
          const pedidoAtual = await tx.pedido.findUnique({
            where: { id: pedido.id },
          });
          if (!pedidoAtual)
            throw new NotFoundException('Pedido nao encontrado.');

          const formaPagamento =
            captura === 'pix'
              ? 'pix'
              : captura === 'credit_card'
                ? 'cartao'
                : pedidoAtual.formaPagamento;
          const pagamentoAtual = asRecord(pedidoAtual.pagamento);
          const jaEstavaPago = ['pago', 'pago_apos_cancelamento'].includes(
            safeString(pagamentoAtual.status),
          );
          const pagamentoAposCancelamento =
            pedidoAtual.status === 'cancelado' || pedidoAtual.estoqueRestaurado;
          const statusProtegidos = ['em_preparacao', 'enviado', 'entregue'];
          const proximoStatus = pagamentoAposCancelamento
            ? 'pagamento_apos_cancelamento'
            : statusProtegidos.includes(pedidoAtual.status)
              ? pedidoAtual.status
              : 'pago';

          const atualizado = await tx.pedido.update({
            where: { id: pedidoAtual.id },
            data: {
              status: proximoStatus,
              formaPagamento,
              pagamento: {
                ...pagamentoAtual,
                status: pagamentoAposCancelamento
                  ? 'pago_apos_cancelamento'
                  : 'pago',
                slug,
                transactionNsu,
                captureMethod: captura || null,
                receiptUrl: this.urlHttps(
                  verificacao.receipt_url || input.receipt_url,
                ),
                pagoEm: new Date().toISOString(),
              },
            },
          });

          return { atualizado, jaEstavaPago, pagamentoAposCancelamento };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

    let resultado: Awaited<ReturnType<typeof registrarPagamento>> | null = null;
    for (let tentativa = 1; tentativa <= 3; tentativa += 1) {
      try {
        resultado = await registrarPagamento();
        break;
      } catch (erro: unknown) {
        if (safeString(asRecord(erro).code) !== 'P2034' || tentativa === 3)
          throw erro;
        this.logger.warn(
          `Conflito ao confirmar o pedido ${pedido.id}; repetindo a transacao (${tentativa}/3).`,
        );
      }
    }
    if (!resultado)
      throw new BadGatewayException(
        'Nao foi possivel registrar o pagamento agora.',
      );

    const { atualizado, jaEstavaPago, pagamentoAposCancelamento } = resultado;

    if (!jaEstavaPago) {
      if (pagamentoAposCancelamento) {
        void Promise.resolve(
          this.emailsService.pagamentoAposCancelamento(atualizado),
        ).catch((erro) =>
          this.logger.error(
            'Falha ao alertar pagamento tardio: ' + String(erro),
          ),
        );
      } else {
        void Promise.allSettled([
          this.emailsService.pagamentoConfirmado(atualizado),
          this.emailsService.novoPedidoPagoAdmin(atualizado),
        ]);
      }
    }

    return {
      pago: true,
      pedidoId: atualizado.id,
      numeroPedido: atualizado.numero,
      status: atualizado.status,
    };
  }
}
