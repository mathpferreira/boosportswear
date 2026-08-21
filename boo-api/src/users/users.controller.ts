import {
  Controller,
  Get,
  Patch,
  Param,
  ParseUUIDPipe,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AtualizarRoleDto, ListarUsuariosDto } from './users.dto';
import type { AuthenticatedRequest } from '../common/types/request';

@Controller('admin/usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  listar(@Query() query: ListarUsuariosDto) {
    return this.usersService.listar(query);
  }

  @Patch(':id/role')
  atualizarRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AtualizarRoleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.atualizarRole(id, body.role, req.user.id);
  }
}
