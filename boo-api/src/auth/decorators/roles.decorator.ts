import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// Uso: @Roles('ADMIN') acima de uma rota, sempre junto com RolesGuard
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);