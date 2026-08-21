import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const erro =
      exception.code === 'P2002'
        ? new ConflictException('Já existe um registro com estes dados.')
        : exception.code === 'P2025'
          ? new NotFoundException('Registro não encontrado.')
          : exception.code === 'P2003'
            ? new ConflictException(
                'Este registro está vinculado a outros dados e não pode ser removido.',
              )
            : null;

    if (!erro) {
      response.status(500).json({
        statusCode: 500,
        message: 'Não foi possível concluir a operação no banco de dados.',
      });
      return;
    }

    const payload = erro.getResponse();
    response.status(erro.getStatus()).json(payload);
  }
}
