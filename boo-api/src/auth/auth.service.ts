import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Cadastro de Novo Usuário (Cliente ou Admin)
  async cadastrar(dados: { nome: string; email: string; senha: string; role?: 'ADMIN' | 'CLIENTE' }) {
    const usuarioExiste = await this.prisma.user.findUnique({ where: { email: dados.email } });
    if (usuarioExiste) {
      throw new BadRequestException('E-mail já cadastrado.');
    }

    const senhaHash = await bcrypt.hash(dados.senha, 10);

    const usuario = await this.prisma.user.create({
      data: {
        nome: dados.nome,
        email: dados.email,
        senha: senhaHash,
        role: dados.role || 'CLIENTE',
      },
    });

    const token = this.gerarToken(usuario.id, usuario.email, usuario.role);
    return { token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role } };
  }

  // Login de Usuário
  async login(email: string, senhaPlana: string) {
    const usuario = await this.prisma.user.findUnique({ where: { email } });
    if (!usuario) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const senhaValida = await bcrypt.compare(senhaPlana, usuario.senha);
    if (!senhaValida) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const token = this.gerarToken(usuario.id, usuario.email, usuario.role);
    return { token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role } };
  }

  private gerarToken(id: string, email: string, role: string) {
    return this.jwtService.sign({ sub: id, email, role });
  }
}