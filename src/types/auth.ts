
export interface CloudUser {
  id: string;
  email: string;
  name: string;
  role: 'Administrador' | 'DevOps Engineer' | 'Analista Cloud';
  initials: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: CloudUser['role'];
  initials: string;
}

export type LoginStep = 'email' | 'password';

export interface EmailCheckResult {
  exists: boolean;
}

export interface PasswordCheckResult {
  ok: boolean;
  user?: AuthUser;
}
