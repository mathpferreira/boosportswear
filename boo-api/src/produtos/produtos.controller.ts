import { Controller, Get, Post, Body } from '@nestjs/common';
import { ProdutosService } from './produtos.service';

@Controller('produtos')
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  @Get()
  async getProdutos() {
    return await this.produtosService.listarTodos();
  }

  @Post()
  async createProduto(@Body() body: any) {
    return await this.produtosService.criarProduto(body);
  }
}