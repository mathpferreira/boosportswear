import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import sharp from 'sharp';
import { unlink, rename } from 'fs/promises';
import { ProdutosService } from './produtos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

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

  // ---- ROTAS PÚBLICAS (qualquer visitante da loja pode ver produtos) ----

  @Get()
  async listarTodos() {
    return await this.produtosService.listarTodos();
  }

  @Get(':id')
  async buscarPorId(@Param('id') id: string) {
    return await this.produtosService.buscarPorId(id);
  }

  // ---- ROTAS PROTEGIDAS (só admin logado pode criar/editar/excluir/upload) ----

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async criarProduto(@Body() dados: any) {
    return await this.produtosService.criarProduto(dados);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async atualizarProduto(@Param('id') id: string, @Body() dados: any) {
    return await this.produtosService.atualizarProduto(id, dados);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async removerProduto(@Param('id') id: string) {
    return await this.produtosService.removerProduto(id);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: diskStorage({
        destination: './uploads/produtos',
        filename: (req, file, callback) => {
          const nomeUnico = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
          callback(null, nomeUnico);
        },
      }),
      limits: { fileSize: 15 * 1024 * 1024 }, // 15MB por imagem (antes da compressão)
    }),
  )
  async uploadImagem(@UploadedFile() arquivo: ArquivoUpload) {
    const caminhoOriginal = arquivo.path;
    const caminhoTemp = `${caminhoOriginal}.tmp`;

    await sharp(caminhoOriginal)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(caminhoTemp);

    await unlink(caminhoOriginal);
    await rename(caminhoTemp, caminhoOriginal);

    return {
      url: `/uploads/produtos/${arquivo.filename}`,
    };
  }
}