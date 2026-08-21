import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { map, Observable } from 'rxjs';

function normalizar(valor: unknown): unknown {
  if (Prisma.Decimal.isDecimal(valor)) return valor.toNumber();
  if (Array.isArray(valor)) return valor.map(normalizar);
  if (valor instanceof Date || valor === null || typeof valor !== 'object')
    return valor;

  return Object.fromEntries(
    Object.entries(valor as Record<string, unknown>).map(([chave, item]) => [
      chave,
      normalizar(item),
    ]),
  );
}

@Injectable()
export class DecimalInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(map(normalizar));
  }
}
