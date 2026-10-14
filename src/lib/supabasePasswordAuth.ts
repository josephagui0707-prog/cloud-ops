// Autenticación real de Supabase mediante correo y contraseña.
// La clave pública se utiliza en el cliente; la clave de servicio nunca se publica.
const url = ((import.meta.env.VITE_SUPABASE_URL as string | undefined) || '').replace(/\/\$/, '');
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || '';
const SESSION = 'cloudops.auth.password.v1';
const LEGACY_GOOGLE_SESSION = 'cloudops.supabase.oauth';

// Detecta la URL de tu Web Service de Render en producción. Si no existe, usa la ruta local vacía.
const BACKEND_URL = (((import.meta.env as any)['VITE_API_URL'] as string | undefined) || '').replace(/\/$/, '');

export interface PasswordSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: {
    id: string;
    email: string;
    user_metadata?: { full_name?: string; name?: string; role?: string; initials?: string };
  };
}

function configured() {
  if (!url || !key || key.includes('PEGA_')) {
    throw Error('Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.');
  }
}

function current(): PasswordSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION);
    return raw ? JSON.parse(raw) as PasswordSession : null;
  } catch { return null; }
}

function store(data: any): PasswordSession {
  const next: PasswordSession = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + (Number(data.expires_in) || 3600),
    user: data.user,
  };
  sessionStorage.setItem(SESSION, JSON.stringify(next));
  sessionStorage.removeItem(LEGACY_GOOGLE_SESSION);
  return next;
}

export function signOutPassword() {
  sessionStorage.removeItem(SESSION);
  // No se recuperan sesiones OAuth de versiones anteriores.
  sessionStorage.removeItem(LEGACY_GOOGLE_SESSION);
  sessionStorage.removeItem('cloudops.pkce');
}

async function tokenRequest(payload: Record<string, string>, grant: 'password' | 'refresh_token') {
  configured();
  const response = await fetch(`${url}/auth/v1/token?grant_type=${grant}`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(18000),
  });
  const text = await response.text();
  let data: any = {};
  try { data = JSON.parse(text); } catch { /* Manejar sin exponer secretos */ }
  if (!response.ok || !data.access_token || !data.user) {
    if (response.status === 400 || response.status === 401 || response.status === 422) {
      throw Error(grant === 'password'
        ? 'Credenciales no válidas o cuenta pendiente de habilitar en Supabase Auth. Ejecuta CONFIGURAR_USUARIOS.bat una vez.'
        : 'Tu sesión expiró. Ingresa nuevamente.');
    }
    throw Error(`No se pudo iniciar sesión en Supabase (${response.status}). Comprueba la URL y la clave pública.`);
  }
  return store(data);
}

export async function signInPassword(email: string, password: string): Promise<PasswordSession> {
  if (!email.trim() || !password) throw Error('Escribe el correo y la contraseña.');
  return tokenRequest({ email: email.trim().toLowerCase(), password }, 'password');
}

export async function getAccessToken(): Promise<string | null> {
  const session = current();
  if (!session) return null;
  if (Date.now() / 1000 < session.expires_at - 75) return session.access_token;
  try {
    const refreshed = await tokenRequest({ refresh_token: session.refresh_token }, 'refresh_token');
    return refreshed.access_token;
  } catch {
    signOutPassword();
    return null;
  }
}

export async function getVerifiedSession(): Promise<PasswordSession | null> {
  const token = await getAccessToken();
  const session = current();
  if (!token || !session) return null;
  configured();
  try {
    const response = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: key, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(14000),
    });
    if (!response.ok) { signOutPassword(); return null; }
    const user = await response.json();
    if (!user.id || !user.email) { signOutPassword(); return null; }
    return { ...session, user };
  } catch {
    // Si la red se cae, no habilitar una sesión que no podemos verificar.
    return null;
  }
}

export async function aiRequest(path: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  if (!token) throw Error('Inicia sesión con las credenciales de CloudOps para usar el análisis privado.');
  
  // Combina dinámicamente la URL del backend (ej: https://onrender.com) con el path (ej: /api/ai/analyze)
  const fullUrl = `${BACKEND_URL}${path}`;

  return fetch(fullUrl, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
}
