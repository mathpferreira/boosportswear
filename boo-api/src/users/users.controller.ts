import { Controller, Get, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  listar() {
    return this.usersService.listar();
  }

  @Patch(':id/role')
  atualizarRole(
    @Param('id') id: string,
    @Body('role') role: 'ADMIN' | 'CLIENTE',
    @Req() req: any,
  ) {
    return this.usersService.atualizarRole(id, role, req.user.id);
  }
}
