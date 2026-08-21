import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsEmail, IsObject, IsOptional } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EmailsService } from './emails.service';

class EmailTesteDto {
  @IsOptional()
  @IsEmail()
  email?: string;
}

class TemplatesDto {
  @IsObject()
  templates!: Record<string, unknown>;
}

@Controller('admin/emails')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Post('teste')
  @Throttle({ default: { limit: 5, ttl: 60 * 60 * 1000 } })
  testar(@Body() body: EmailTesteDto) {
    return this.emailsService.enviarTeste(body.email);
  }

  @Get('templates')
  templates() {
    return this.emailsService.listarTemplates();
  }

  @Patch('templates')
  salvarTemplates(@Body() body: TemplatesDto) {
    return this.emailsService.salvarTemplates(body.templates);
  }

  @Get('entregas')
  entregas(@Query('pagina') pagina?: string) {
    return this.emailsService.listarEntregas(Number(pagina));
  }

  @Post('reprocessar')
  @Throttle({ default: { limit: 5, ttl: 60 * 1000 } })
  async reprocessar() {
    await this.emailsService.processarFila();
    return { sucesso: true };
  }
}
