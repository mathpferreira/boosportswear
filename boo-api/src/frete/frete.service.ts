import { BadGatewayException, BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class FreteService {
  private somenteNumeros(valor: unknown) {
    return String(valor || '').replace(/\D/g, '');
  }

  async cotar(dados: any) {
    const token = process.env.FRENET_TOKEN;
    if (!token) throw new ServiceUnavailableException('Cotacao de frete ainda nao configurada.');

    const cepDestino = this.somenteNumeros(dados?.cep);
    const cepOrigem = this.somenteNumeros(process.env.FRENET_CEP_ORIGEM || '07010000');
    if (cepDestino.length !== 8) throw new BadRequestException('Informe um CEP valido.');

    const itens = Array.isArray(dados?.itens) && dados.itens.length ? dados.itens : [{ quantidade: 1, preco: dados?.subtotal || 1 }];
    const largura = Number(process.env.FRENET_PACOTE_LARGURA || 20);
    const altura = Number(process.env.FRENET_PACOTE_ALTURA || 8);
    const comprimento = Number(process.env.FRENET_PACOTE_COMPRIMENTO || 28);
    const peso = Number(process.env.FRENET_PACOTE_PESO || 0.5);
    const subtotal = Number(dados?.subtotal || itens.reduce((total: number, item: any) => total + Number(item.preco || 0) * Number(item.quantidade || 1), 0));

    const resposta = await fetch('https://api.frenet.com.br/shipping/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', token },
      body: JSON.stringify({
        SellerCEP: cepOrigem,
        RecipientCEP: cepDestino,
        ShipmentInvoiceValue: Math.max(subtotal, 1),
        RecipientCountry: 'BR',
        ShippingItemArray: itens.map((item: any) => ({
          Height: altura,
          Length: comprimento,
          Width: largura,
          Weight: peso,
          Quantity: Math.max(Number(item.quantidade || 1), 1),
          SKU: String(item.id || item.nome || 'BOO'),
          Category: 'Vestuário',
        })),
      }),
    });

    const retorno: any = await resposta.json().catch(() => null);
    if (!resposta.ok) throw new BadGatewayException(retorno?.Message || 'Falha ao consultar a Frenet.');

    const servicos = retorno?.ShippingSevicesArray || retorno?.ShippingServicesArray || [];
    const opcoes = servicos
      .filter((servico: any) => !servico.Error && Number(servico.ShippingPrice) >= 0)
      .map((servico: any) => ({
        codigo: servico.ServiceCode,
        nome: servico.ServiceDescription || servico.Carrier,
        transportadora: servico.Carrier,
        valor: Number(servico.ShippingPrice),
        prazoDias: Number(servico.DeliveryTime),
        prazo: `${Number(servico.DeliveryTime)} dia${Number(servico.DeliveryTime) === 1 ? '' : 's'} uteis`,
      }))
      .sort((a: any, b: any) => a.valor - b.valor);

    if (!opcoes.length) throw new BadGatewayException('Nenhuma modalidade de frete disponivel para este CEP.');
    return { opcoes };
  }
}
