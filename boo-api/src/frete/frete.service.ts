import { BadGatewayException, BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

type ItemFrete = {
  id?: string;
  nome?: string;
  preco?: number;
  quantidade?: number;
};

@Injectable()
export class FreteService {
  private readonly logger = new Logger(FreteService.name);

  private somenteNumeros(valor: unknown) {
    return String(valor || '').replace(/\D/g, '');
  }

  private numeroPositivo(valor: unknown, padrao: number) {
    const numero = Number(valor);
    return Number.isFinite(numero) && numero > 0 ? numero : padrao;
  }

  async cotar(dados: { cep: string; subtotal: number; itens: ItemFrete[] }) {
    const opcoes = await this.obterOpcoes(dados);
    return { opcoes };
  }

  async validarOpcao(dados: { cep: string; subtotal: number; itens: ItemFrete[] }, freteEscolhido: any) {
    const codigo = String(freteEscolhido?.codigo || '').trim();
    if (!codigo) throw new BadRequestException('Escolha uma modalidade de frete antes de finalizar.');

    const opcoes = await this.obterOpcoes(dados);
    const opcao = opcoes.find((item) => String(item.codigo) === codigo);
    if (!opcao) throw new BadRequestException('A cotacao do frete expirou. Calcule novamente.');

    const valorInformado = Number(freteEscolhido?.valor);
    if (!Number.isFinite(valorInformado) || Math.abs(valorInformado - opcao.valor) > 0.05) {
      throw new BadRequestException('O valor do frete mudou. Calcule novamente antes de finalizar.');
    }

    return opcao;
  }

  private async obterOpcoes(dados: { cep: string; subtotal: number; itens: ItemFrete[] }) {
    const token = process.env.FRENET_TOKEN?.trim();
    if (!token) throw new ServiceUnavailableException('Cotacao de frete ainda nao configurada.');

    const cepDestino = this.somenteNumeros(dados?.cep);
    const cepOrigem = this.somenteNumeros(process.env.FRENET_CEP_ORIGEM || '03133000');
    if (cepDestino.length !== 8) throw new BadRequestException('Informe um CEP valido.');
    if (cepOrigem.length !== 8) throw new ServiceUnavailableException('CEP de origem da loja invalido.');

    const itensInformados = Array.isArray(dados?.itens) ? dados.itens.slice(0, 50) : [];
    const itens = itensInformados.length ? itensInformados : [{ quantidade: 1, preco: dados?.subtotal || 1 }];
    const largura = this.numeroPositivo(process.env.FRENET_PACOTE_LARGURA, 20);
    const altura = this.numeroPositivo(process.env.FRENET_PACOTE_ALTURA, 8);
    const comprimento = this.numeroPositivo(process.env.FRENET_PACOTE_COMPRIMENTO, 28);
    const peso = this.numeroPositivo(process.env.FRENET_PACOTE_PESO, 0.5);
    const subtotal = Number(dados?.subtotal || 0);
    if (!Number.isFinite(subtotal) || subtotal < 0) throw new BadRequestException('Subtotal invalido.');

    let resposta: Response;
    try {
      resposta = await fetch('https://api.frenet.com.br/shipping/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          token,
          'User-Agent': 'Boo Sportwear (contato@boosportswear.com.br)',
        },
        body: JSON.stringify({
          SellerCEP: cepOrigem,
          RecipientCEP: cepDestino,
          ShipmentInvoiceValue: Math.max(subtotal, 1),
          RecipientCountry: 'BR',
          ShippingItemArray: itens.map((item) => ({
            Height: altura,
            Length: comprimento,
            Width: largura,
            Weight: peso,
            Quantity: Math.max(Number(item.quantidade || 1), 1),
            SKU: String(item.id || item.nome || 'BOO'),
            Category: 'Vestuario',
          })),
        }),
        signal: AbortSignal.timeout(10000),
      });
    } catch (erro: any) {
      this.logger.error(`Falha na cotacao Frenet: ${erro?.message || erro}`);
      throw new BadGatewayException('O servidor nao conseguiu conectar a Frenet.');
    }

    const textoResposta = await resposta.text();
    let retorno: any = null;
    try { retorno = textoResposta ? JSON.parse(textoResposta) : null; } catch { retorno = null; }
    if (!resposta.ok) {
      this.logger.error(`Frenet retornou ${resposta.status}: ${textoResposta.slice(0, 500)}`);
      throw new BadGatewayException(retorno?.Message || 'Falha ao consultar a Frenet.');
    }

    const servicos = retorno?.ShippingSevicesArray || retorno?.ShippingServicesArray || retorno?.ShippingServices || [];
    const opcoes = servicos
      .filter((servico: any) => !servico.Error && Number.isFinite(Number(servico.ShippingPrice)) && Number(servico.ShippingPrice) >= 0)
      .map((servico: any) => ({
        codigo: servico.ServiceCode,
        nome: servico.ServiceDescription || servico.Carrier,
        transportadora: servico.Carrier,
        valor: Number(servico.ShippingPrice),
        prazoDias: Number(servico.DeliveryTime),
        prazo: `${Number(servico.DeliveryTime)} dia${Number(servico.DeliveryTime) === 1 ? '' : 's'} uteis`,
      }))
      .sort((a: any, b: any) => a.valor - b.valor);

    if (!opcoes.length) {
      this.logger.warn(`Frenet nao retornou servicos para ${cepDestino}: ${textoResposta.slice(0, 500)}`);
      throw new BadGatewayException('Nenhuma modalidade de frete disponivel para este CEP.');
    }

    return opcoes;
  }
}
