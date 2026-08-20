import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EmailsService } from './emails.service';

@Controller('admin/emails')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Post('teste')
  testar(@Body('email') email?: string) {
    return this.emailsService.enviarTeste(email);
  }
}
