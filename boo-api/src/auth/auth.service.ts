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

  // Cadastro de Novo Usuário
  // IMPORTANTE: role NUNCA é aceito do corpo da requisição.
  // Todo cadastro público nasce como CLIENTE. Promoção a ADMIN
  // só acontece pelo painel admin (rota protegida), nunca aqui.
  async cadastrar(dados: { nome: string; email: string; senha: string }) {
    const nome = String(dados?.nome || '').trim();
    const email = String(dados?.email || '').trim().toLowerCase();
    const senha = String(dados?.senha || '');
    if (nome.length < 2 || nome.length > 120) throw new BadRequestException('Informe um nome valido.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestException('Informe um e-mail valido.');
    if (senha.length < 6 || senha.length > 128) throw new BadRequestException('A senha deve ter entre 6 e 128 caracteres.');

    const usuarioExiste = await this.prisma.user.findUnique({ where: { email } });
    if (usuarioExiste) {
      throw new BadRequestException('E-mail já cadastrado.');
    }

    const senhaHash = await bcrypt.hash(senha, 12);

    const usuario = await this.prisma.user.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        role: 'CLIENTE',
      },
    });

    const token = this.gerarToken(usuario.id, usuario.email, usuario.role);
    return { token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role } };
  }

  // Login de Usuário
  async login(email: string, senhaPlana: string) {
    const emailNormalizado = String(email || '').trim().toLowerCase();
    const senha = String(senhaPlana || '');
    if (!emailNormalizado || senha.length < 1 || senha.length > 128) throw new UnauthorizedException('E-mail ou senha incorretos.');
    const usuario = await this.prisma.user.findUnique({ where: { email: emailNormalizado } });
    if (!usuario) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
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
