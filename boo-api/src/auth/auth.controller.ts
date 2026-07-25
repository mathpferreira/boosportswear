import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('cadastro')
  cadastrar(@Body() body: any) {
    return this.authService.cadastrar(body);
  }

  @Post('login')
  login(@Body() body: any) {
    return this.authService.login(body.email, body.senha);
  }
}