import { BadRequestException } from '@nestjs/common';
import { FreteService } from './frete.service';

describe('FreteService', () => {
  const tokenAnterior = process.env.FRENET_TOKEN;

  afterEach(() => {
    jest.restoreAllMocks();
    if (tokenAnterior === undefined) delete process.env.FRENET_TOKEN;
    else process.env.FRENET_TOKEN = tokenAnterior;
  });

  it('recusa cidade ou estado que nao correspondem ao CEP', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        cep: '08529-100',
        logradouro: 'Rua Teste',
        bairro: 'Centro',
        localidade: 'Ferraz de Vasconcelos',
        uf: 'SP',
      }),
    } as any);

    await expect(new FreteService().validarEnderecoEntrega({
      cep: '08529-100',
      cidade: 'Cuiaba',
      estado: 'MT',
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('recalcula no servidor e recusa o valor de frete adulterado', async () => {
    process.env.FRENET_TOKEN = 'token-de-teste';
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify({
        ShippingSevicesArray: [{
          ServiceCode: 'SEDEX',
          ServiceDescription: 'Sedex',
          Carrier: 'Correios',
          ShippingPrice: '25.90',
          DeliveryTime: 3,
          Error: false,
        }],
      })),
    } as any);

    await expect(new FreteService().validarOpcao({
      cep: '78000000',
      subtotal: 100,
      itens: [{ id: 'produto-1', quantidade: 1, preco: 100 }],
    }, {
      codigo: 'SEDEX',
      valor: 0,
    })).rejects.toBeInstanceOf(BadRequestException);
  });
});
