import { Body, Controller, HttpException, HttpStatus, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  private readonly tentativas = new Map<string, { quantidade: number; expiraEm: number }>();

  constructor(private readonly authService: AuthService) {}

  private limitar(origem: string, req: any) {
    const ip = String(req?.ip || 'desconhecido');
    const chave = `${origem}:${ip}`;
    const agora = Date.now();
    const atual = this.tentativas.get(chave);
    if (!atual || atual.expiraEm <= agora) {
      this.tentativas.set(chave, { quantidade: 1, expiraEm: agora + 10 * 60 * 1000 });
      return;
    }
    if (atual.quantidade >= 12) {
      throw new HttpException('Muitas tentativas. Aguarde alguns minutos e tente novamente.', HttpStatus.TOO_MANY_REQUESTS);
    }
    atual.quantidade += 1;
  }

  @Post('cadastro')
  cadastrar(@Body() body: any, @Req() req: any) {
    this.limitar('cadastro', req);
    return this.authService.cadastrar(body);
  }

  @Post('login')
  login(@Body() body: any, @Req() req: any) {
    this.limitar('login', req);
    return this.authService.login(body.email, body.senha);
  }
}
