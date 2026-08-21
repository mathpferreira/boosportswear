import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { asRecord, errorMessage, safeString } from '../common/utils/value';

type ItemFrete = {
  id?: string;
  nome?: string;
  preco?: number;
  quantidade?: number;
  pesoKg?: number;
  alturaCm?: number;
  larguraCm?: number;
  comprimentoCm?: number;
};

type OpcaoFrete = {
  codigo: string;
  nome: string;
  valor: number;
  prazo: string;
  valorPendente?: boolean;
  cobranca?: string;
  transportadora?: string;
  prazoDias?: number;
};

@Injectable()
export class FreteService {
  private readonly logger = new Logger(FreteService.name);
  private readonly cidadesMotoboy = new Set([
    'sao paulo',
    'aruja',
    'barueri',
    'biritiba mirim',
    'caieiras',
    'cajamar',
    'carapicuiba',
    'cotia',
    'diadema',
    'embu das artes',
    'embu guacu',
    'ferraz de vasconcelos',
    'francisco morato',
    'franco da rocha',
    'guararema',
    'guarulhos',
    'itapecerica da serra',
    'itapevi',
    'itaquaquecetuba',
    'jandira',
    'juquitiba',
    'mairipora',
    'maua',
    'mogi das cruzes',
    'osasco',
    'pirapora do bom jesus',
    'poa',
    'ribeirao pires',
    'rio grande da serra',
    'salesopolis',
    'santa isabel',
    'santana de parnaiba',
    'santo andre',
    'sao bernardo do campo',
    'sao caetano do sul',
    'suzano',
    'taboao da serra',
    'vargem grande paulista',
  ]);

  constructor(private readonly prisma: PrismaService) {}

  private somenteNumeros(valor: unknown) {
    return safeString(valor).replace(/\D/g, '');
  }

  private numeroPositivo(valor: unknown, padrao: number) {
    const numero = Number(valor);
    return Number.isFinite(numero) && numero > 0 ? numero : padrao;
  }

  private normalizarCidade(valor: unknown) {
    return safeString(valor)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z\s]/g, '')
      .trim();
  }

  private async consultarCep(cep: string) {
    const cepLimpo = this.somenteNumeros(cep);
    if (cepLimpo.length !== 8)
      throw new BadRequestException('Informe um CEP valido.');

    let resposta: Response;
    try {
      resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(6000),
      });
    } catch (erro: unknown) {
      this.logger.error(
        `Falha ao validar CEP do motoboy: ${errorMessage(erro)}`,
      );
      throw new BadGatewayException(
        'Nao foi possivel validar a area do motoboy.',
      );
    }

    const destino = asRecord(await resposta.json().catch(() => null));
    if (
      !resposta.ok ||
      destino.erro ||
      !safeString(destino.uf) ||
      !safeString(destino.localidade)
    ) {
      throw new BadRequestException('CEP de entrega nao encontrado.');
    }

    return {
      cep: cepLimpo,
      rua: safeString(destino.logradouro).trim(),
      bairro: safeString(destino.bairro).trim(),
      cidade: safeString(destino.localidade).trim(),
      estado: safeString(destino.uf).trim().toUpperCase(),
    };
  }

  async validarEnderecoEntrega(entrega: Record<string, unknown>) {
    const destino = await this.consultarCep(safeString(entrega.cep));
    const cidadeInformada = this.normalizarCidade(entrega.cidade);
    const estadoInformado = safeString(entrega.estado).trim().toUpperCase();

    if (estadoInformado && estadoInformado !== destino.estado) {
      throw new BadRequestException(
        'O estado informado nao corresponde ao CEP de entrega.',
      );
    }
    if (
      cidadeInformada &&
      cidadeInformada !== this.normalizarCidade(destino.cidade)
    ) {
      throw new BadRequestException(
        'A cidade informada nao corresponde ao CEP de entrega.',
      );
    }

    return {
      ...entrega,
      cep: destino.cep,
      rua: safeString(entrega.rua, destino.rua).trim(),
      bairro: safeString(entrega.bairro, destino.bairro).trim(),
      cidade: destino.cidade,
      estado: destino.estado,
    };
  }

  private async validarDestinoMotoboy(cep: string) {
    const destino = await this.consultarCep(cep);
    const cidade = this.normalizarCidade(destino.cidade);
    if (destino.estado !== 'SP' || !this.cidadesMotoboy.has(cidade)) {
      throw new BadRequestException(
        'Motoboy disponivel apenas para a capital e Grande Sao Paulo.',
      );
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
    const itensRecebidos = Array.isArray(dados?.itens)
      ? dados.itens.slice(0, 50)
      : [];
    const quantidades = new Map<string, number>();
    for (const item of itensRecebidos) {
      const id = String(item?.id || '').trim();
      const quantidade = Math.floor(Number(item?.quantidade || 0));
      if (!id || quantidade < 1 || quantidade > 20) {
        throw new BadRequestException('Itens da cotacao invalidos.');
      }
      quantidades.set(id, (quantidades.get(id) || 0) + quantidade);
    }
    if (!quantidades.size)
      throw new BadRequestException('Informe ao menos um produto para cotar.');

    const produtos = await this.prisma.produto.findMany({
      where: {
        id: { in: [...quantidades.keys()] },
        oculto: false,
        excluidoEm: null,
      },
    });
    if (produtos.length !== quantidades.size) {
      throw new BadRequestException(
        'Um produto da cotacao nao esta disponivel.',
      );
    }
    const itens = produtos.map((produto) => ({
      id: produto.id,
      nome: produto.nome,
      preco: Number(produto.preco),
      quantidade: quantidades.get(produto.id) || 1,
      pesoKg: Number(produto.pesoKg),
      alturaCm: produto.alturaCm,
      larguraCm: produto.larguraCm,
      comprimentoCm: produto.comprimentoCm,
    }));
    const subtotal = itens.reduce(
      (total, item) => total + Number(item.preco) * Number(item.quantidade),
      0,
    );
    const opcoes = await this.obterOpcoes({ cep: dados.cep, subtotal, itens });
    return { opcoes };
  }

  async validarOpcao(
    dados: { cep: string; subtotal: number; itens: ItemFrete[] },
    freteEscolhido: Record<string, unknown>,
  ) {
    const codigo = safeString(freteEscolhido.codigo).trim();
    if (!codigo)
      throw new BadRequestException(
        'Escolha uma modalidade de frete antes de finalizar.',
      );

    const opcoes = await this.obterOpcoes(dados);
    const opcao = opcoes.find((item) => item.codigo === codigo);
    if (!opcao)
      throw new BadRequestException(
        'A cotacao do frete expirou. Calcule novamente.',
      );

    if (codigo === 'motoboy') return opcao;

    const valorInformado = Number(freteEscolhido.valor);
    if (
      !Number.isFinite(valorInformado) ||
      Math.abs(valorInformado - opcao.valor) > 0.05
    ) {
      throw new BadRequestException(
        'O valor do frete mudou. Calcule novamente antes de finalizar.',
      );
    }

    return opcao;
  }

  private async obterOpcoes(dados: {
    cep: string;
    subtotal: number;
    itens: ItemFrete[];
  }): Promise<OpcaoFrete[]> {
    const token = process.env.FRENET_TOKEN?.trim();
    if (!token)
      throw new ServiceUnavailableException(
        'Cotacao de frete ainda nao configurada.',
      );

    const configuracao = await this.prisma.configuracao.findFirst({
      select: { frete: true },
    });
    const freteConfig =
      configuracao?.frete &&
      typeof configuracao.frete === 'object' &&
      !Array.isArray(configuracao.frete)
        ? (configuracao.frete as Record<string, unknown>)
        : {};
    if (freteConfig.ativo === false) {
      throw new ServiceUnavailableException(
        'As cotacoes de frete estao temporariamente pausadas.',
      );
    }

    const cepDestino = this.somenteNumeros(dados?.cep);
    const cepOrigem = this.somenteNumeros(
      freteConfig.cepOrigem || process.env.FRENET_CEP_ORIGEM || '03133000',
    );
    if (cepDestino.length !== 8)
      throw new BadRequestException('Informe um CEP valido.');
    if (cepOrigem.length !== 8)
      throw new ServiceUnavailableException('CEP de origem da loja invalido.');

    const destino = await this.consultarCep(cepDestino);
    if (
      freteConfig.motoboyAtivo !== false &&
      destino.estado === 'SP' &&
      this.cidadesMotoboy.has(this.normalizarCidade(destino.cidade))
    ) {
      return [await this.validarDestinoMotoboy(cepDestino)];
    }

    const itensInformados = Array.isArray(dados?.itens)
      ? dados.itens.slice(0, 50)
      : [];
    const itens = itensInformados.length
      ? itensInformados
      : [{ quantidade: 1, preco: dados?.subtotal || 1 }];
    const largura = this.numeroPositivo(
      freteConfig.larguraCm || process.env.FRENET_PACOTE_LARGURA,
      20,
    );
    const altura = this.numeroPositivo(
      freteConfig.alturaCm || process.env.FRENET_PACOTE_ALTURA,
      8,
    );
    const comprimento = this.numeroPositivo(
      freteConfig.comprimentoCm || process.env.FRENET_PACOTE_COMPRIMENTO,
      28,
    );
    const peso = this.numeroPositivo(
      freteConfig.pesoKg || process.env.FRENET_PACOTE_PESO,
      0.5,
    );
    const subtotal = Number(dados?.subtotal || 0);
    if (!Number.isFinite(subtotal) || subtotal < 0)
      throw new BadRequestException('Subtotal invalido.');

    let resposta: Response;
    try {
      resposta = await fetch('https://api.frenet.com.br/shipping/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          token,
          'User-Agent': 'Boo Sportwear (pedidos@boosportwear.com)',
        },
        body: JSON.stringify({
          SellerCEP: cepOrigem,
          RecipientCEP: cepDestino,
          ShipmentInvoiceValue: Math.max(subtotal, 1),
          RecipientCountry: 'BR',
          ShippingItemArray: itens.map((item) => ({
            Height: this.numeroPositivo(item.alturaCm, altura),
            Length: this.numeroPositivo(item.comprimentoCm, comprimento),
            Width: this.numeroPositivo(item.larguraCm, largura),
            Weight: this.numeroPositivo(item.pesoKg, peso),
            Quantity: Math.max(Number(item.quantidade || 1), 1),
            SKU: item.id || item.nome || 'BOO',
            Category: 'Vestuario',
          })),
        }),
        signal: AbortSignal.timeout(10000),
      });
    } catch (erro: unknown) {
      this.logger.error(`Falha na cotacao Frenet: ${errorMessage(erro)}`);
      throw new BadGatewayException(
        'O servidor nao conseguiu conectar a Frenet.',
      );
    }

    const textoResposta = await resposta.text();
    let retorno: unknown = null;
    try {
      retorno = textoResposta ? JSON.parse(textoResposta) : null;
    } catch {
      retorno = null;
    }
    if (!resposta.ok) {
      this.logger.error(
        `Frenet retornou ${resposta.status}: ${textoResposta.slice(0, 500)}`,
      );
      throw new BadGatewayException(
        safeString(asRecord(retorno).Message, 'Falha ao consultar a Frenet.'),
      );
    }

    const retornoObj = asRecord(retorno);
    const servicos =
      retornoObj.ShippingSevicesArray ||
      retornoObj.ShippingServicesArray ||
      retornoObj.ShippingServices ||
      [];
    const opcoes: OpcaoFrete[] = (Array.isArray(servicos) ? servicos : [])
      .map(asRecord)
      .filter(
        (servico) =>
          !servico.Error &&
          Number.isFinite(Number(servico.ShippingPrice)) &&
          Number(servico.ShippingPrice) >= 0,
      )
      .map((servico) => {
        const prazoDias = Math.max(0, Number(servico.DeliveryTime) || 0);
        return {
          codigo: safeString(servico.ServiceCode),
          nome: safeString(
            servico.ServiceDescription,
            safeString(servico.Carrier, 'Transportadora'),
          ),
          transportadora: safeString(servico.Carrier),
          valor: Number(servico.ShippingPrice),
          prazoDias,
          prazo: `${prazoDias} dia${prazoDias === 1 ? '' : 's'} uteis`,
        };
      })
      .filter((opcao) => Boolean(opcao.codigo))
      .sort((a, b) => a.valor - b.valor);

    if (!opcoes.length) {
      this.logger.warn(
        `Frenet nao retornou servicos para ${cepDestino}: ${textoResposta.slice(0, 500)}`,
      );
      throw new BadGatewayException(
        'Nenhuma modalidade de frete disponivel para este CEP.',
      );
    }

    return opcoes;
  }
}
