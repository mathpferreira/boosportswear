import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';
import type { AuthenticatedRequest } from '../common/types/request';

const ACOES: Record<string, string> = {
  POST: 'Criou',
  PUT: 'Atualizou',
  PATCH: 'Atualizou',
  DELETE: 'Excluiu',
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const metodo = String(req.method || '').toUpperCase();
    const usuario = req.user;
    const deveRegistrar =
      Boolean(ACOES[metodo]) &&
      usuario?.role === 'ADMIN' &&
      String(req.originalUrl || req.url || '').startsWith('/api/');

    if (!deveRegistrar) return next.handle();

    const caminho = String(req.originalUrl || req.url || '').split('?')[0];
    const partes = caminho.split('/').filter(Boolean);
    const entidade =
      partes[1] === 'admin' ? partes[2] || 'admin' : partes[1] || 'api';
    const entidadeId = req.params?.id ? String(req.params.id) : undefined;

    return next.handle().pipe(
      tap(() => {
        void this.auditService.registrar({
          actor: usuario,
          acao: ACOES[metodo] + ' ' + entidade,
          entidade,
          entidadeId,
          detalhes: { metodo, caminho },
          ip: req.ip,
        });
      }),
    );
  }
}
