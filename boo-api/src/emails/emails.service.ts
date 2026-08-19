import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);

  private escapar(valor: unknown) {
    return String(valor || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private dadosCliente(pedido: any) {
    const entrega = pedido?.entrega && typeof pedido.entrega === 'object' ? pedido.entrega : {};
    return {
      nome: String(entrega.nome || 'Cliente').trim(),
      email: String(entrega.email || '').trim().toLowerCase(),
    };
  }

  private template(titulo: string, nome: string, conteudo: string) {
    return `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b"><div style="max-width:600px;margin:0 auto;padding:32px 16px"><div style="background:#fff;padding:32px;border:1px solid #e4e4e7"><p style="margin:0 0 28px;font-size:13px;font-weight:700;letter-spacing:3px">BOO SPORTWEAR</p><h1 style="margin:0 0 18px;font-size:24px">${this.escapar(titulo)}</h1><p style="font-size:14px;line-height:1.6">Olá, ${this.escapar(nome)}.</p>${conteudo}<p style="margin-top:32px;font-size:12px;color:#71717a">Mensagem automática da BOO Sportwear.</p></div></div></body></html>`;
  }

  private moeda(valor: unknown) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  private async enviar(para: string, assunto: string, html: string) {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const remetente = process.env.EMAIL_FROM?.trim();
    if (!apiKey || !remetente || !para) return false;

    try {
      const resposta = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'BOO Sportwear API',
        },
        body: JSON.stringify({ from: remetente, to: [para], subject: assunto, html }),
        signal: AbortSignal.timeout(10000),
      });
      if (!resposta.ok) {
        this.logger.error(`Resend recusou o e-mail (${resposta.status}): ${(await resposta.text()).slice(0, 500)}`);
        return false;
      }
      return true;
    } catch (erro: any) {
      this.logger.error(`Falha ao enviar e-mail: ${erro?.message || erro}`);
      return false;
    }
  }

  async pedidoAguardando(pedido: any, checkoutUrl: string) {
    const cliente = this.dadosCliente(pedido);
    const limite = pedido.expiraEmPagamento
      ? new Date(pedido.expiraEmPagamento).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      : '';
    const conteudo = `<p style="font-size:14px;line-height:1.6">Recebemos o pedido <strong>#${this.escapar(pedido.numero)}</strong>. O estoque está reservado${limite ? ` até <strong>${this.escapar(limite)}</strong>` : ''}.</p><p style="margin:24px 0"><a href="${this.escapar(checkoutUrl)}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:14px 22px;font-size:12px;font-weight:700">CONTINUAR PAGAMENTO</a></p>`;
    return this.enviar(cliente.email, `Pedido #${pedido.numero} aguardando pagamento`, this.template('Aguardando pagamento', cliente.nome, conteudo));
  }

  async pagamentoConfirmado(pedido: any) {
    const cliente = this.dadosCliente(pedido);
    const conteudo = `<p style="font-size:14px;line-height:1.6">O pedido <strong>#${this.escapar(pedido.numero)}</strong> foi confirmado e o pagamento foi aprovado. A BOO iniciará a preparação e avisará quando ele estiver a caminho.</p>`;
    return this.enviar(cliente.email, `Pedido #${pedido.numero} confirmado`, this.template('Pedido confirmado', cliente.nome, conteudo));
  }

  async novoPedidoPagoAdmin(pedido: any) {
    const admin = process.env.EMAIL_ADMIN?.trim();
    if (!admin) return false;

    const cliente = this.dadosCliente(pedido);
    const itens = Array.isArray(pedido?.itens) ? pedido.itens : [];
    const entrega = pedido?.entrega && typeof pedido.entrega === 'object' ? pedido.entrega : {};
    const frete = pedido?.frete && typeof pedido.frete === 'object' ? pedido.frete : {};
    const listaItens = itens.map((item: any) => (
      `<li style="margin-bottom:8px">${this.escapar(item.quantidade)}x ${this.escapar(item.nome)} — tamanho ${this.escapar(item.tamanhoEscolhido || item.tamanho || 'U')}</li>`
    )).join('');
    const conteudo = `<p style="font-size:14px;line-height:1.6">Um novo pedido foi pago e precisa ser preparado.</p><p style="font-size:14px;line-height:1.6"><strong>Pedido:</strong> #${this.escapar(pedido.numero)}<br><strong>Cliente:</strong> ${this.escapar(cliente.nome)} (${this.escapar(cliente.email)})<br><strong>Total:</strong> ${this.escapar(this.moeda(pedido.total))}<br><strong>Pagamento:</strong> ${this.escapar(pedido.formaPagamento || 'InfinitePay')}<br><strong>Entrega:</strong> ${this.escapar(frete.nome || 'Não informada')}<br><strong>Destino:</strong> ${this.escapar(`${entrega.cidade || ''}/${entrega.estado || ''} - CEP ${entrega.cep || ''}`)}</p><p style="font-size:14px;font-weight:700">Itens</p><ul style="font-size:14px;line-height:1.5;padding-left:20px">${listaItens}</ul>`;
    return this.enviar(admin, `Novo pedido pago #${pedido.numero} - ${this.moeda(pedido.total)}`, this.template('Novo pedido pago', 'Administração', conteudo));
  }

  async pedidoCancelado(pedido: any, motivo: string) {
    const cliente = this.dadosCliente(pedido);
    const conteudo = `<p style="font-size:14px;line-height:1.6">O pedido <strong>#${this.escapar(pedido.numero)}</strong> foi cancelado. Motivo: ${this.escapar(motivo)}.</p>`;
    return this.enviar(cliente.email, `Pedido #${pedido.numero} cancelado`, this.template('Pedido cancelado', cliente.nome, conteudo));
  }

  async statusPedido(pedido: any, status: string) {
    const mensagens: Record<string, { titulo: string; texto: string }> = {
      em_preparacao: {
        titulo: 'Pedido em preparação',
        texto: 'Seu pagamento foi confirmado e a BOO está preparando as peças do seu pedido.',
      },
      enviado: {
        titulo: 'Pedido enviado',
        texto: 'Seu pedido saiu para entrega. Acompanhe as atualizações na sua conta da BOO.',
      },
      entregue: {
        titulo: 'Pedido entregue',
        texto: 'Seu pedido foi marcado como entregue. Esperamos que você aproveite suas novas peças.',
      },
    };
    const mensagem = mensagens[status];
    if (!mensagem) return false;
    const cliente = this.dadosCliente(pedido);
    const conteudo = `<p style="font-size:14px;line-height:1.6">${this.escapar(mensagem.texto)}</p><p style="font-size:14px;line-height:1.6">Pedido <strong>#${this.escapar(pedido.numero)}</strong>.</p>`;
    return this.enviar(cliente.email, `${mensagem.titulo} - pedido #${pedido.numero}`, this.template(mensagem.titulo, cliente.nome, conteudo));
  }

  async pagamentoAposCancelamento(pedido: any) {
    const admin = process.env.EMAIL_ADMIN?.trim();
    if (!admin) return false;
    const conteudo = `<p style="font-size:14px;line-height:1.6">O pedido <strong>#${this.escapar(pedido.numero)}</strong> recebeu pagamento depois de ter sido cancelado e ter o estoque devolvido. Verifique disponibilidade ou realize o estorno na InfinitePay.</p>`;
    return this.enviar(admin, `AÇÃO NECESSÁRIA: pagamento tardio #${pedido.numero}`, this.template('Pagamento após cancelamento', 'Administração', conteudo));
  }
}
