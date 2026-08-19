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
  private readonly cidadesMotoboy = new Set([
    'sao paulo', 'aruja', 'barueri', 'biritiba mirim', 'caieiras', 'cajamar',
    'carapicuiba', 'cotia', 'diadema', 'embu das artes', 'embu guacu',
    'ferraz de vasconcelos', 'francisco morato', 'franco da rocha', 'guararema',
    'guarulhos', 'itapecerica da serra', 'itapevi', 'itaquaquecetuba', 'jandira',
    'juquitiba', 'mairipora', 'maua', 'mogi das cruzes', 'osasco',
    'pirapora do bom jesus', 'poa', 'ribeirao pires', 'rio grande da serra',
    'salesopolis', 'santa isabel', 'santana de parnaiba', 'santo andre',
    'sao bernardo do campo', 'sao caetano do sul', 'suzano', 'taboao da serra',
    'vargem grande paulista',
  ]);

  private somenteNumeros(valor: unknown) {
    return String(valor || '').replace(/\D/g, '');
  }

  private numeroPositivo(valor: unknown, padrao: number) {
    const numero = Number(valor);
    return Number.isFinite(numero) && numero > 0 ? numero : padrao;
  }

  private normalizarCidade(valor: unknown) {
    return String(valor || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z\s]/g, '')
      .trim();
  }

  private async consultarCep(cep: string) {
    const cepLimpo = this.somenteNumeros(cep);
    if (cepLimpo.length !== 8) throw new BadRequestException('Informe um CEP valido.');

    let resposta: Response;
    try {
      resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(6000),
      });
    } catch (erro: any) {
      this.logger.error(`Falha ao validar CEP do motoboy: ${erro?.message || erro}`);
      throw new BadGatewayException('Nao foi possivel validar a area do motoboy.');
    }

    const destino = await resposta.json().catch(() => null);
    if (!resposta.ok || destino?.erro || !destino?.uf || !destino?.localidade) {
      throw new BadRequestException('CEP de entrega nao encontrado.');
    }

    return {
      cep: cepLimpo,
      rua: String(destino.logradouro || '').trim(),
      bairro: String(destino.bairro || '').trim(),
      cidade: String(destino.localidade || '').trim(),
      estado: String(destino.uf || '').trim().toUpperCase(),
    };
  }

  async validarEnderecoEntrega(entrega: Record<string, any>) {
    const destino = await this.consultarCep(entrega?.cep);
    const cidadeInformada = this.normalizarCidade(entrega?.cidade);
    const estadoInformado = String(entrega?.estado || '').trim().toUpperCase();

    if (estadoInformado && estadoInformado !== destino.estado) {
      throw new BadRequestException('O estado informado nao corresponde ao CEP de entrega.');
    }
    if (cidadeInformada && cidadeInformada !== this.normalizarCidade(destino.cidade)) {
      throw new BadRequestException('A cidade informada nao corresponde ao CEP de entrega.');
    }

    return {
      ...entrega,
      cep: destino.cep,
      rua: String(entrega?.rua || destino.rua).trim(),
      bairro: String(entrega?.bairro || destino.bairro).trim(),
      cidade: destino.cidade,
      estado: destino.estado,
    };
  }

  private async validarDestinoMotoboy(cep: string) {
    const destino = await this.consultarCep(cep);
    const cidade = this.normalizarCidade(destino.cidade);
    if (destino.estado !== 'SP' || !this.cidadesMotoboy.has(cidade)) {
      throw new BadRequestException('Motoboy disponivel apenas para a capital e Grande Sao Paulo.');
    }

    return {
      codigo: 'motoboy',
      nome: 'Motoboy no mesmo dia',
      valor: 0,
      valorPendente: true,
      cobranca: 'a_combinar_pelo_instagram',
      prazo: 'Mesmo dia, conforme disponibilidade',
    };
  }

  async cotar(dados: { cep: string; subtotal: number; itens: ItemFrete[] }) {
    const opcoes = await this.obterOpcoes(dados);
    return { opcoes };
  }

  async validarOpcao(dados: { cep: string; subtotal: number; itens: ItemFrete[] }, freteEscolhido: any) {
    const codigo = String(freteEscolhido?.codigo || '').trim();
    if (!codigo) throw new BadRequestException('Escolha uma modalidade de frete antes de finalizar.');

    if (codigo === 'motoboy') {
      return this.validarDestinoMotoboy(dados.cep);
    }

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
