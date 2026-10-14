import { mockUsers } from '../data/mockUsers';
import { signInPassword } from './supabasePasswordAuth';
import { AuthUser, EmailCheckResult, PasswordCheckResult } from '../types/auth';

const NETWORK_DELAY_MS = 550;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;

// Intentos fallidos por correo, en memoria. En un backend real esto viviría
// en el servidor (o en algo como AWS WAF / Cognito advanced security) para
// que no pueda evadirse recargando la página.
const failedAttempts = new Map<string, { count: number; lockedUntil: number | null }>();

function delay<T>(value: T, ms = NETWORK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Simula la primera etapa del login: verificar si el correo está registrado,
 * sin revelar nunca si el problema real fue el correo o la contraseña una
 * vez que se pasa a la segunda etapa (evita user enumeration en el paso 2).
 */
export async function checkEmailExists(email: string): Promise<EmailCheckResult> {
  const normalized = normalizeEmail(email);
  const exists = mockUsers.some((user) => user.email === normalized);
  return delay({ exists });
}

export function getLockoutState(email: string): { lockedUntil: number | null } {
  const record = failedAttempts.get(normalizeEmail(email));
  if (!record || !record.lockedUntil) return { lockedUntil: null };
  if (Date.now() > record.lockedUntil) return { lockedUntil: null };
  return { lockedUntil: record.lockedUntil };
}

/**
 * Simula la segunda etapa: verificar la contraseña para un correo ya
 * confirmado como registrado, con un bloqueo temporal tras varios intentos
 * fallidos consecutivos.
 */
export async function verifyPassword(email: string, password: string): Promise<PasswordCheckResult> {
  const normalized = normalizeEmail(email);
  const lockout = getLockoutState(normalized);
  if (lockout.lockedUntil) {
    return delay({ ok: false });
  }

  // Validación REAL en Supabase Auth; no se envían contraseñas a un mock local.
  let verifiedUser: AuthUser | undefined;
  try {
    const session = await signInPassword(normalized, password);
    const profile = mockUsers.find(p => p.email === session.user.email?.toLowerCase());
    const name = session.user.user_metadata?.name || profile?.name || session.user.email;
    verifiedUser = {
      id: session.user.id, // UUID real para RLS de Supabase
      email: session.user.email,
      name,
      role: profile?.role || 'Analista Cloud',
      initials: profile?.initials || name.slice(0, 2).toUpperCase(),
    };
  } catch {
    // Misma respuesta pública para correo desconocido, contraseña inválida o cuenta sin provisionar.
  }
  const success = Boolean(verifiedUser);

  const record = failedAttempts.get(normalized) ?? { count: 0, lockedUntil: null };
  if (success) {
    failedAttempts.delete(normalized);
  } else {
    record.count += 1;
    if (record.count >= MAX_ATTEMPTS) {
      record.lockedUntil = Date.now() + LOCKOUT_MS;
      record.count = 0;
    }
    failedAttempts.set(normalized, record);
  }

  if (!success || !verifiedUser) {
    return delay({ ok: false });
  }

  const authUser = verifiedUser;
  return delay({ ok: true, user: authUser });
}

export const authConfig = {
  maxAttempts: MAX_ATTEMPTS,
  lockoutMs: LOCKOUT_MS,
};
