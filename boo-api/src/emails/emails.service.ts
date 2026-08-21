import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Pedido, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { asRecord, errorMessage, safeString } from '../common/utils/value';

type TemplateEmail = {
  assunto: string;
  corpo: string;
  ativo: boolean;
};

type TemplatesEmail = Record<string, TemplateEmail>;

const TEMPLATES_PADRAO: TemplatesEmail = {
  verificar_conta: {
    assunto: 'Confirme seu e-mail na BOO Sportwear',
    corpo:
      'Olá, {{nome}}.\n\nConfirme seu e-mail para liberar compras e proteger sua conta:\n{{link}}\n\nO link expira em 24 horas.',
    ativo: true,
  },
  recuperar_senha: {
    assunto: 'Recuperação de senha - BOO Sportwear',
    corpo:
      'Olá, {{nome}}.\n\nRecebemos uma solicitação para redefinir sua senha:\n{{link}}\n\nO link expira em 30 minutos. Ignore esta mensagem se não foi você.',
    ativo: true,
  },
  pedido_aguardando: {
    assunto: 'Pedido #{{pedido}} aguardando pagamento',
    corpo:
      'Olá, {{nome}}.\n\nRecebemos seu pedido #{{pedido}} e o estoque está reservado até {{limite}}.\n\nContinue o pagamento por este link:\n{{link}}',
    ativo: true,
  },
  pagamento_confirmado: {
    assunto: 'Pedido #{{pedido}} confirmado',
    corpo:
      'Olá, {{nome}}.\n\nSeu pagamento foi aprovado e o pedido #{{pedido}} está confirmado. A BOO avisará quando ele entrar em preparação.',
    ativo: true,
  },
  novo_pedido_admin: {
    assunto: 'Novo pedido pago #{{pedido}} - {{total}}',
    corpo:
      'Um novo pedido foi pago e precisa ser preparado.\n\nCliente: {{nome}} ({{email}})\nTotal: {{total}}\nPagamento: {{pagamento}}\nEntrega: {{frete}}\nDestino: {{destino}}\n\nItens:\n{{itens}}',
    ativo: true,
  },
  pedido_cancelado: {
    assunto: 'Pedido #{{pedido}} cancelado',
    corpo:
      'Olá, {{nome}}.\n\nO pedido #{{pedido}} foi cancelado.\nMotivo: {{motivo}}.',
    ativo: true,
  },
  em_preparacao: {
    assunto: 'Pedido #{{pedido}} em preparação',
    corpo:
      'Olá, {{nome}}.\n\nSeu pagamento foi confirmado e a BOO está preparando as peças do pedido #{{pedido}}.',
    ativo: true,
  },
  enviado: {
    assunto: 'Pedido #{{pedido}} enviado',
    corpo:
      'Olá, {{nome}}.\n\nSeu pedido #{{pedido}} saiu para entrega. Acompanhe as atualizações na sua conta da BOO.',
    ativo: true,
  },
  entregue: {
    assunto: 'Pedido #{{pedido}} entregue',
    corpo:
      'Olá, {{nome}}.\n\nO pedido #{{pedido}} foi marcado como entregue. Esperamos que você aproveite suas novas peças.',
    ativo: true,
  },
  pagamento_tardio_admin: {
    assunto: 'AÇÃO NECESSÁRIA: pagamento tardio #{{pedido}}',
    corpo:
      'O pedido #{{pedido}} recebeu pagamento depois do cancelamento e da devolução do estoque. Verifique a disponibilidade ou realize o estorno na InfinitePay.',
    ativo: true,
  },
  teste: {
    assunto: 'Teste de e-mail - BOO Sportwear',
    corpo:
      'O envio de e-mails da loja está configurado e respondendo corretamente.\n\nEste teste não altera pedidos, pagamentos ou estoque.',
    ativo: true,
  },
};

const EVENTOS_OBRIGATORIOS = new Set(['verificar_conta', 'recuperar_senha']);
const VARIAVEIS_EMAIL = new Set([
  'nome',
  'pedido',
  'total',
  'link',
  'limite',
  'email',
  'pagamento',
  'frete',
  'destino',
  'itens',
  'motivo',
]);

@Injectable()
export class EmailsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailsService.name);
  private timer?: NodeJS.Timeout;
  private processando = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.processarFila(), 30_000);
    this.timer.unref?.();
    void this.processarFila();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private escapar(valor: unknown) {
    return safeString(valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private moeda(valor: unknown) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  private dadosCliente(pedido: Pedido) {
    const entrega = asRecord(pedido.entrega);
    return {
      nome: safeString(entrega.nome, 'Cliente').trim(),
      email: safeString(entrega.email).trim().toLowerCase(),
    };
  }

  private substituir(texto: string, variaveis: Record<string, unknown>) {
    return texto.replace(
      /\{\{([a-zA-Z0-9_]+)\}\}/g,
      (_match: string, chave: string) => safeString(variaveis[chave]),
    );
  }

  private htmlMensagem(titulo: string, corpo: string) {
    const textoSeguro = this.escapar(corpo).replace(/\r?\n/g, '<br>');
    const comLinks = textoSeguro.replace(
      /(https:\/\/[^\s<]+)/g,
      '<a href="$1" style="color:#111;text-decoration:underline;word-break:break-all">$1</a>',
    );
    return (
      '<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b">' +
      '<div style="max-width:600px;margin:0 auto;padding:32px 16px"><div style="background:#fff;padding:32px;border:1px solid #e4e4e7">' +
      '<p style="margin:0 0 28px;font-size:13px;font-weight:700;letter-spacing:3px">BOO SPORTWEAR</p>' +
      '<h1 style="margin:0 0 18px;font-size:24px">' +
      this.escapar(titulo) +
      '</h1><p style="font-size:14px;line-height:1.7">' +
      comLinks +
      '</p><p style="margin-top:32px;font-size:12px;color:#71717a">Mensagem automática da BOO Sportwear.</p>' +
      '</div></div></body></html>'
    );
  }

  private normalizarTemplates(valor: unknown): TemplatesEmail {
    const salvos = asRecord(valor);
    return Object.fromEntries(
      Object.entries(TEMPLATES_PADRAO).map(([evento, padrao]) => {
        const customizado = asRecord(salvos[evento]);
        return [
          evento,
          {
            assunto: safeString(customizado.assunto, padrao.assunto).slice(
              0,
              180,
            ),
            corpo: safeString(customizado.corpo, padrao.corpo).slice(0, 5000),
            ativo: EVENTOS_OBRIGATORIOS.has(evento)
              ? true
              : customizado.ativo === undefined
                ? padrao.ativo
                : Boolean(customizado.ativo),
          },
        ];
      }),
    );
  }

  async listarTemplates() {
    const config = await this.prisma.configuracao.findFirst({
      select: { emailTemplates: true },
    });
    return this.normalizarTemplates(config?.emailTemplates);
  }

  async salvarTemplates(valor: unknown) {
    const templates = this.normalizarTemplates(valor);
    for (const [evento, template] of Object.entries(templates)) {
      if (!template.assunto.trim() || !template.corpo.trim()) {
        throw new BadRequestException(
          `Assunto e corpo sao obrigatorios no modelo ${evento}.`,
        );
      }
      const marcadores = [template.assunto, template.corpo]
        .flatMap((texto) => [...texto.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)])
        .map((resultado) => resultado[1]);
      const desconhecida = marcadores.find(
        (variavel) => !VARIAVEIS_EMAIL.has(variavel),
      );
      if (desconhecida) {
        throw new BadRequestException(
          `A variavel {{${desconhecida}}} nao e suportada.`,
        );
      }
      if (
        EVENTOS_OBRIGATORIOS.has(evento) &&
        !template.corpo.includes('{{link}}')
      ) {
        throw new BadRequestException(
          `O modelo ${evento} precisa manter a variavel {{link}}.`,
        );
      }
    }
    let config = await this.prisma.configuracao.findFirst({
      select: { id: true },
    });
    if (!config)
      config = await this.prisma.configuracao.create({
        data: {},
        select: { id: true },
      });
    await this.prisma.configuracao.update({
      where: { id: config.id },
      data: { emailTemplates: templates },
    });
    return templates;
  }

  private async montar(
    evento: string,
    variaveis: Record<string, unknown>,
  ): Promise<{ assunto: string; html: string } | null> {
    const templates = await this.listarTemplates();
    const template = templates[evento] || TEMPLATES_PADRAO[evento];
    if (!template || !template.ativo) return null;
    const assunto = this.substituir(template.assunto, variaveis)
      .replace(/[\r\n]+/g, ' ')
      .trim()
      .slice(0, 180);
    const corpo = this.substituir(template.corpo, variaveis);
    return { assunto, html: this.htmlMensagem(assunto, corpo) };
  }

  private async solicitarEnvio(
    idempotencyKey: string,
    para: string,
    assunto: string,
    html: string,
  ) {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const remetente = process.env.EMAIL_FROM?.trim();
    if (!apiKey)
      return { sucesso: false, erro: 'RESEND_API_KEY não configurada.' };
    if (!remetente)
      return { sucesso: false, erro: 'EMAIL_FROM não configurado.' };
    if (!para) return { sucesso: false, erro: 'Destinatário não informado.' };

    try {
      const resposta = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + apiKey,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
          'User-Agent': 'BOO Sportwear API',
        },
        body: JSON.stringify({
          from: remetente,
          to: [para],
          subject: assunto,
          html,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const corpo = await resposta.text();
      if (!resposta.ok) {
        return {
          sucesso: false,
          erro:
            'Resend recusou o e-mail (' +
            resposta.status +
            '): ' +
            corpo.slice(0, 500),
        };
      }
      try {
        const retorno = asRecord(JSON.parse(corpo) as unknown);
        return {
          sucesso: true,
          id: safeString(retorno.id) || undefined,
        };
      } catch {
        return { sucesso: true, id: undefined };
      }
    } catch (erro: unknown) {
      return {
        sucesso: false,
        erro: 'Falha ao enviar e-mail: ' + errorMessage(erro),
      };
    }
  }

  private async processarMensagem(id: string) {
    const mensagem = await this.prisma.emailOutbox.findUnique({
      where: { id },
    });
    if (!mensagem || mensagem.status === 'SENT' || mensagem.tentativas >= 5)
      return false;

    const reservado = await this.prisma.emailOutbox.updateMany({
      where: {
        id,
        status: mensagem.status,
        tentativas: mensagem.tentativas,
        proximaTentativa: { lte: new Date() },
      },
      data: {
        tentativas: { increment: 1 },
        proximaTentativa: new Date(Date.now() + 2 * 60_000),
      },
    });
    if (reservado.count !== 1) return false;

    const resultado = await this.solicitarEnvio(
      mensagem.id,
      mensagem.destinatario,
      mensagem.assunto,
      mensagem.html,
    );
    const tentativas = mensagem.tentativas + 1;

    if (resultado.sucesso) {
      await this.prisma.emailOutbox.update({
        where: { id },
        data: {
          status: 'SENT',
          providerId: resultado.id || null,
          ultimoErro: null,
          enviadoEm: new Date(),
        },
      });
      return true;
    }

    const esperaMinutos = Math.min(60, Math.pow(2, tentativas));
    await this.prisma.emailOutbox.update({
      where: { id },
      data: {
        status: 'FAILED',
        ultimoErro: resultado.erro?.slice(0, 1000),
        proximaTentativa: new Date(Date.now() + esperaMinutos * 60_000),
      },
    });
    this.logger.error(resultado.erro);
    return false;
  }

  async processarFila() {
    if (this.processando) return;
    this.processando = true;
    try {
      const mensagens = await this.prisma.emailOutbox.findMany({
        where: {
          status: { in: ['PENDING', 'FAILED'] },
          tentativas: { lt: 5 },
          proximaTentativa: { lte: new Date() },
        },
        orderBy: { criadoEm: 'asc' },
        take: 20,
        select: { id: true },
      });
      for (const mensagem of mensagens)
        await this.processarMensagem(mensagem.id);
      await this.prisma.emailOutbox.deleteMany({
        where: {
          status: 'SENT',
          enviadoEm: { lt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
        },
      });
    } catch (erro: unknown) {
      this.logger.error(
        'Falha ao processar fila de e-mails: ' + errorMessage(erro),
      );
    } finally {
      this.processando = false;
    }
  }

  private async enfileirar(
    evento: string,
    para: string,
    variaveis: Record<string, unknown>,
    enviarAgora = true,
  ) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(para || ''))) return false;
    const mensagem = await this.montar(evento, variaveis);
    if (!mensagem) return false;
    const registro = await this.prisma.emailOutbox.create({
      data: {
        destinatario: para,
        assunto: mensagem.assunto,
        html: mensagem.html,
        evento,
      },
    });
    return enviarAgora ? this.processarMensagem(registro.id) : true;
  }

  async listarEntregas(paginaInformada = 1) {
    const pagina = Math.max(1, Math.floor(Number(paginaInformada) || 1));
    const limite = 50;
    const [itens, total] = await this.prisma.$transaction([
      this.prisma.emailOutbox.findMany({
        select: {
          id: true,
          destinatario: true,
          assunto: true,
          evento: true,
          status: true,
          tentativas: true,
          ultimoErro: true,
          criadoEm: true,
          enviadoEm: true,
        },
        orderBy: { criadoEm: 'desc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      this.prisma.emailOutbox.count(),
    ]);
    return {
      itens,
      total,
      pagina,
      paginas: Math.max(1, Math.ceil(total / limite)),
    };
  }

  async enviarTeste(para?: string) {
    const destinatario = String(para || process.env.EMAIL_ADMIN || '')
      .trim()
      .toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destinatario)) {
      throw new BadRequestException('Informe um e-mail de teste válido.');
    }
    const sucesso = await this.enfileirar('teste', destinatario, {
      nome: 'Administração',
    });
    if (!sucesso)
      throw new ServiceUnavailableException(
        'O provedor recusou o e-mail de teste.',
      );
    return { sucesso: true, destinatario };
  }

  verificarConta(usuario: Pick<User, 'email' | 'nome'>, link: string) {
    return this.enfileirar('verificar_conta', usuario.email, {
      nome: usuario.nome,
      link,
    });
  }

  recuperarSenha(usuario: Pick<User, 'email' | 'nome'>, link: string) {
    return this.enfileirar('recuperar_senha', usuario.email, {
      nome: usuario.nome,
      link,
    });
  }

  pedidoAguardando(pedido: Pedido, checkoutUrl: string) {
    const cliente = this.dadosCliente(pedido);
    const limite = pedido.expiraEmPagamento
      ? new Date(pedido.expiraEmPagamento).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
        })
      : '';
    return this.enfileirar('pedido_aguardando', cliente.email, {
      nome: cliente.nome,
      pedido: pedido.numero,
      limite,
      link: checkoutUrl,
    });
  }

  pagamentoConfirmado(pedido: Pedido) {
    const cliente = this.dadosCliente(pedido);
    return this.enfileirar('pagamento_confirmado', cliente.email, {
      nome: cliente.nome,
      pedido: pedido.numero,
    });
  }

  novoPedidoPagoAdmin(pedido: Pedido) {
    const admin = process.env.EMAIL_ADMIN?.trim();
    if (!admin) return false;
    const cliente = this.dadosCliente(pedido);
    const itens = Array.isArray(pedido.itens) ? pedido.itens : [];
    const entrega = asRecord(pedido.entrega);
    const frete = asRecord(pedido.frete);
    return this.enfileirar('novo_pedido_admin', admin, {
      pedido: pedido.numero,
      nome: cliente.nome,
      email: cliente.email,
      total: this.moeda(pedido.total),
      pagamento: pedido.formaPagamento || 'InfinitePay',
      frete: safeString(frete.nome, 'Não informada'),
      destino:
        safeString(entrega.cidade) +
        '/' +
        safeString(entrega.estado) +
        ' - CEP ' +
        safeString(entrega.cep),
      itens: itens
        .map((valor) => {
          const item = asRecord(valor);
          return (
            safeString(item.quantidade, '0') +
            'x ' +
            safeString(item.nome, 'Produto') +
            ' - tamanho ' +
            safeString(item.tamanhoEscolhido, safeString(item.tamanho, 'U'))
          );
        })
        .join('\n'),
    });
  }

  pedidoCancelado(pedido: Pedido, motivo: string) {
    const cliente = this.dadosCliente(pedido);
    return this.enfileirar('pedido_cancelado', cliente.email, {
      nome: cliente.nome,
      pedido: pedido.numero,
      motivo,
    });
  }

  async statusPedido(pedido: Pedido, status: string) {
    if (!['em_preparacao', 'enviado', 'entregue'].includes(status))
      return false;
    if (pedido.usuarioId) {
      const usuario = await this.prisma.user.findUnique({
        where: { id: pedido.usuarioId },
        select: { preferenciasConta: true },
      });
      const preferencias = asRecord(usuario?.preferenciasConta);
      if (preferencias.statusPedidoEmail === false) return false;
    }
    const cliente = this.dadosCliente(pedido);
    return this.enfileirar(status, cliente.email, {
      nome: cliente.nome,
      pedido: pedido.numero,
    });
  }

  pagamentoAposCancelamento(pedido: Pedido) {
    const admin = process.env.EMAIL_ADMIN?.trim();
    if (!admin) return false;
    return this.enfileirar('pagamento_tardio_admin', admin, {
      pedido: pedido.numero,
    });
  }
}
