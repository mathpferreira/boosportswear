import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import sharp from 'sharp';
import { unlink, rename } from 'fs/promises';
import { randomUUID } from 'crypto';
import { Throttle } from '@nestjs/throttler';
import { ProdutosService } from './produtos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SalvarProdutoDto } from './produtos.dto';

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

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async listarTodosAdmin() {
    return await this.produtosService.listarTodosAdmin();
  }

  @Get(':id')
  async buscarPorId(@Param('id', ParseUUIDPipe) id: string) {
    return await this.produtosService.buscarPublicoPorId(id);
  }

  // ---- ROTAS PROTEGIDAS (só admin logado pode criar/editar/excluir/upload) ----

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async criarProduto(@Body() dados: SalvarProdutoDto) {
    return await this.produtosService.criarProduto(dados);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async atualizarProduto(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dados: SalvarProdutoDto,
  ) {
    return await this.produtosService.atualizarProduto(id, dados);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async removerProduto(@Param('id', ParseUUIDPipe) id: string) {
    return await this.produtosService.removerProduto(id);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Throttle({ default: { limit: 30, ttl: 60 * 60 * 1000 } })
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: diskStorage({
        destination: './uploads/produtos',
        filename: (req, file, callback) => {
          const nomeUnico = `${randomUUID()}.webp`;
          callback(null, nomeUnico);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, callback) => {
        const tiposAceitos = ['image/jpeg', 'image/png', 'image/webp'];
        callback(null, tiposAceitos.includes(file.mimetype));
      },
    }),
  )
  async uploadImagem(@UploadedFile() arquivo: ArquivoUpload) {
    if (!arquivo)
      throw new BadRequestException('Envie uma imagem JPEG, PNG ou WEBP.');
    const caminhoOriginal = arquivo.path;
    const caminhoTemp = `${caminhoOriginal}.tmp`;

    try {
      await sharp(caminhoOriginal, {
        failOn: 'error',
        limitInputPixels: 40_000_000,
      })
        .rotate()
        .resize({
          width: 1200,
          height: 1800,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 78 })
        .toFile(caminhoTemp);

      await unlink(caminhoOriginal);
      await rename(caminhoTemp, caminhoOriginal);
    } catch {
      await Promise.allSettled([unlink(caminhoOriginal), unlink(caminhoTemp)]);
      throw new BadRequestException(
        'A imagem esta corrompida ou excede o limite de resolucao.',
      );
    }

    return {
      url: `/uploads/produtos/${arquivo.filename}`,
    };
  }
}
