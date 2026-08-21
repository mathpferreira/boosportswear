import type { Request } from 'express';

export type SessionUser = {
  id: string;
  nome: string;
  email: string;
  role: string;
  emailVerificado: boolean;
};

export type CookieRequest = Omit<Request, 'cookies'> & {
  cookies?: Record<string, string | undefined>;
};

export type AuthenticatedRequest = CookieRequest & {
  user: SessionUser;
};
