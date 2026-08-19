import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailsService } from '../emails/emails.service';

type CriarCheckoutInput = {
  orderNsu: string;
  total: number;
  entrega: Record<string, any>;
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
export class InfinitePayService {
  private readonly logger = new Logger(InfinitePayService.name);
  private readonly apiUrl = 'https://api.checkout.infinitepay.io';

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailsService: EmailsService,
  ) {}

  private get handle() {
    return process.env.INFINITEPAY_HANDLE?.trim() || 'gabriel-batista-zzu';
  }

  private normalizarBaseUrl(valor: string, nome: string) {
    try {
      const url = new URL(valor);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Protocolo invalido');
      return url.origin;
    } catch {
      throw new ServiceUnavailableException(`${nome} nao configurada para o checkout.`);
    }
  }

  private async lerResposta(resposta: Response) {
    const texto = await resposta.text();
    try {
      return texto ? JSON.parse(texto) : null;
    } catch {
      return null;
    }
  }

  private telefoneComPais(telefone: unknown) {
    const numeros = String(telefone || '').replace(/\D/g, '');
    if (!numeros) return undefined;
    return `+${numeros.startsWith('55') ? numeros : `55${numeros}`}`;
  }

  private urlHttps(valor: unknown) {
    try {
      const url = new URL(String(valor || ''));
      return url.protocol === 'https:' ? url.toString() : null;
    } catch {
      return null;
    }
  }

  async criarCheckout(input: CriarCheckoutInput) {
    const totalCentavos = Math.round(Number(input.total) * 100);
    if (!Number.isInteger(totalCentavos) || totalCentavos < 1) {
      throw new BadRequestException('O total do pedido precisa ser maior que zero.');
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
      items: [{
        quantity: 1,
        price: totalCentavos,
        description: `Pedido BOO ${input.orderNsu.slice(0, 8).toUpperCase()}`,
      }],
      customer: {
        name: String(input.entrega.nome || '').trim(),
        email: String(input.entrega.email || '').trim(),
        ...(telefone ? { phone_number: telefone } : {}),
      },
      address: {
        cep: String(input.entrega.cep || '').replace(/\D/g, ''),
        street: String(input.entrega.rua || '').trim(),
        neighborhood: String(input.entrega.bairro || '').trim(),
        number: String(input.entrega.numero || '').trim(),
        complement: String(input.entrega.complemento || '').trim(),
      },
    };

    let resposta: Response;
    try {
      resposta = await fetch(`${this.apiUrl}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(12000),
      });
    } catch (erro: any) {
      this.logger.error(`Falha ao criar checkout InfinitePay: ${erro?.message || erro}`);
      throw new BadGatewayException('Nao foi possivel abrir o pagamento agora. Tente novamente.');
    }

    const retorno = await this.lerResposta(resposta);
    const checkoutUrl = String(retorno?.url || '').trim();
    if (!resposta.ok || !checkoutUrl.startsWith('https://')) {
      this.logger.error(`InfinitePay recusou o checkout (${resposta.status}): ${JSON.stringify(retorno)?.slice(0, 800)}`);
      throw new BadGatewayException('A InfinitePay nao conseguiu gerar o pagamento.');
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

  async confirmar(input: ConfirmarPagamentoInput, usuarioId?: string) {
    const orderNsu = String(input.order_nsu || '').trim();
    const transactionNsu = String(input.transaction_nsu || '').trim();
    const slug = String(input.slug || input.invoice_slug || '').trim();
    if (!orderNsu || !transactionNsu || !slug) {
      throw new BadRequestException('Identificadores do pagamento incompletos.');
    }

    const pedido = await this.prisma.pedido.findUnique({ where: { id: orderNsu } });
    if (!pedido || (usuarioId && pedido.usuarioId !== usuarioId)) {
      throw new NotFoundException('Pedido nao encontrado.');
    }

    let resposta: Response;
    try {
      resposta = await fetch(`${this.apiUrl}/payment_check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          handle: this.handle,
          order_nsu: orderNsu,
          transaction_nsu: transactionNsu,
          slug,
        }),
        signal: AbortSignal.timeout(10000),
      });
    } catch (erro: any) {
      this.logger.error(`Falha ao confirmar pagamento InfinitePay: ${erro?.message || erro}`);
      throw new BadGatewayException('Nao foi possivel confirmar o pagamento agora.');
    }

    const verificacao = await this.lerResposta(resposta);
    if (!resposta.ok) {
      this.logger.error(`InfinitePay recusou a verificacao (${resposta.status}): ${JSON.stringify(verificacao)?.slice(0, 800)}`);
      throw new BadGatewayException('A InfinitePay nao confirmou a transacao.');
    }

    if (!verificacao?.success || !verificacao?.paid) {
      return { pago: false, pedidoId: pedido.id, numeroPedido: pedido.numero, status: pedido.status };
    }

    const totalEsperado = Math.round(Number(pedido.total) * 100);
    const totalConfirmado = Number(verificacao.amount);
    if (!Number.isInteger(totalConfirmado) || totalConfirmado !== totalEsperado) {
      this.logger.error(`Divergencia no pedido ${pedido.id}: esperado ${totalEsperado}, confirmado ${totalConfirmado}`);
      throw new BadRequestException('O valor confirmado nao corresponde ao total do pedido.');
    }

    const captura = String(verificacao.capture_method || input.capture_method || '').toLowerCase();
    const registrarPagamento = () => this.prisma.$transaction(async (tx) => {
      const pedidoAtual = await tx.pedido.findUnique({ where: { id: pedido.id } });
      if (!pedidoAtual) throw new NotFoundException('Pedido nao encontrado.');

      const formaPagamento = captura === 'pix'
        ? 'pix'
        : captura === 'credit_card' ? 'cartao' : pedidoAtual.formaPagamento;
      const pagamentoAtual = pedidoAtual.pagamento
        && typeof pedidoAtual.pagamento === 'object'
        && !Array.isArray(pedidoAtual.pagamento)
        ? pedidoAtual.pagamento as Record<string, any>
        : {};
      const jaEstavaPago = ['pago', 'pago_apos_cancelamento'].includes(String(pagamentoAtual.status || ''));
      const pagamentoAposCancelamento = pedidoAtual.status === 'cancelado' || pedidoAtual.estoqueRestaurado;
      const statusProtegidos = ['em_preparacao', 'enviado', 'entregue'];
      const proximoStatus = pagamentoAposCancelamento
        ? 'pagamento_apos_cancelamento'
        : statusProtegidos.includes(pedidoAtual.status) ? pedidoAtual.status : 'pago';

      const atualizado = await tx.pedido.update({
        where: { id: pedidoAtual.id },
        data: {
          status: proximoStatus,
          formaPagamento,
          pagamento: {
            ...pagamentoAtual,
            status: pagamentoAposCancelamento ? 'pago_apos_cancelamento' : 'pago',
            slug,
            transactionNsu,
            captureMethod: captura || null,
            receiptUrl: this.urlHttps(verificacao.receipt_url || input.receipt_url),
            pagoEm: new Date().toISOString(),
          },
        },
      });

      return { atualizado, jaEstavaPago, pagamentoAposCancelamento };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    let resultado: Awaited<ReturnType<typeof registrarPagamento>> | null = null;
    for (let tentativa = 1; tentativa <= 3; tentativa += 1) {
      try {
        resultado = await registrarPagamento();
        break;
      } catch (erro: any) {
        if (erro?.code !== 'P2034' || tentativa === 3) throw erro;
        this.logger.warn(`Conflito ao confirmar o pedido ${pedido.id}; repetindo a transacao (${tentativa}/3).`);
      }
    }
    if (!resultado) throw new BadGatewayException('Nao foi possivel registrar o pagamento agora.');

    const { atualizado, jaEstavaPago, pagamentoAposCancelamento } = resultado;

    if (!jaEstavaPago) {
      if (pagamentoAposCancelamento) {
        void this.emailsService.pagamentoAposCancelamento(atualizado);
      } else {
        void Promise.allSettled([
          this.emailsService.pagamentoConfirmado(atualizado),
          this.emailsService.novoPedidoPagoAdmin(atualizado),
        ]);
      }
    }

    return { pago: true, pedidoId: atualizado.id, numeroPedido: atualizado.numero, status: atualizado.status };
  }
}
