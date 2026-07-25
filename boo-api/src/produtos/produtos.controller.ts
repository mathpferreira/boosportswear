import { Controller, Get, Post, Put, Delete, Body, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as sharp from 'sharp';
import { unlink, rename } from 'fs/promises';
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
          // Sempre salva como .webp, já que vamos converter todas as imagens nesse formato
          const nomeUnico = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
          callback(null, nomeUnico);
        },
      }),
      limits: { fileSize: 15 * 1024 * 1024 }, // 15MB por imagem (antes da compressão)
    }),
  )
  async uploadImagem(@UploadedFile() arquivo: ArquivoUpload) {
    // O multer já salvou o arquivo original no destino, mas com o nome final em .webp.
    // Como o buffer ainda não foi processado, o arquivo salvo é o original "cru" (jpg/png/etc
    // com extensão .webp trocada). Precisamos reprocessar esse arquivo com o sharp:
    // redimensionar para no máximo 1200px de largura e comprimir de verdade para .webp.

    const caminhoOriginal = arquivo.path;
    const caminhoTemp = `${caminhoOriginal}.tmp`;

    await sharp(caminhoOriginal)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(caminhoTemp);

    // Substitui o arquivo cru pelo comprimido
    await unlink(caminhoOriginal);
    await rename(caminhoTemp, caminhoOriginal);

    return {
      url: `/uploads/produtos/${arquivo.filename}`,
    };
  }
}