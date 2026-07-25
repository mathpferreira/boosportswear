import { Controller, Get, Post, Put, Delete, Body, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProdutosService } from './produtos.service';

interface ArquivoUpload {
  filename: string;
  originalname: string;
  path: string;
  size: number;
  mimetype: string;
}

@Controller('produtos') // Junto com o /api do main.ts, vira /api/produtos
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  @Get()
  async listarTodos() {
    return await this.produtosService.listarTodos();
  }

  @Get(':id')
  async buscarPorId(@Param('id') id: string) {
    return await this.produtosService.buscarPorId(id);
  }

  @Post()
  async criarProduto(@Body() dados: any) {
    return await this.produtosService.criarProduto(dados);
  }

  @Put(':id')
  async atualizarProduto(@Param('id') id: string, @Body() dados: any) {
    return await this.produtosService.atualizarProduto(id, dados);
  }

  @Delete(':id')
  async removerProduto(@Param('id') id: string) {
    return await this.produtosService.removerProduto(id);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: diskStorage({
        destination: './uploads/produtos',
        filename: (req, file, callback) => {
          const nomeUnico = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
          callback(null, nomeUnico);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB por imagem
    }),
  )
  async uploadImagem(@UploadedFile() arquivo: ArquivoUpload) {
    return {
      url: `/uploads/produtos/${arquivo.filename}`,
    };
  }
}