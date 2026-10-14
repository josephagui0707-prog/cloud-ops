// Alta inicial única de cuentas CloudOps con correo/contraseña de la versión anterior.
// Ejecutar LOCALMENTE con SERVICE_ROLE de Supabase. No crear usuarios desde el navegador.
// Requiere Node 20+ y la variable SUPABASE_SERVICE_ROLE_KEY solo durante este proceso.
const base = (process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!base || !key || key.includes('PEGA_')) {
  console.error('ERROR: Para el alta inicial, configura VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.');
  console.error('Obtén la clave service_role (Legacy) desde Supabase > Settings > API Keys.');
  console.error('Nunca coloques esa clave en VITE_, GitHub, frontend ni capturas.');
  process.exit(1);
}

const accounts = [
  { email: 'admin@cloudops.io', name: 'Jordy Aguilar', role: 'Administrador' },
  { email: 'jordy@cloudops.io', name: 'Jordy Aguilar', role: 'DevOps Engineer' },
  { email: 'sandro@cloudops.io', name: 'Sandro Tucto', role: 'Analista Cloud' },
  { email: 'victor@cloudops.io', name: 'Victor Vargas', role: 'DevOps Engineer' },
  { email: 'marco@cloudops.io', name: 'Marco Escalante', role: 'Analista Cloud' },
  { email: 'josue@cloudops.io', name: 'Josue Pilco', role: 'DevOps Engineer' },
  { email: 'hugo@cloudops.io', name: 'Hugo Cahua', role: 'Analista Cloud' },
];
const headers = { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` };
async function call(method, url, body) {
  const response = await fetch(`${base}/auth/v1/admin/${url}`, {
    method, headers, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Error(`Supabase ${response.status}: ${String(data.message || data.msg || data.error || 'operación no autorizada').slice(0,180)}`);
  return data;
}

try {
  // Evitar modificar contraseñas existentes y repetición accidental.
  const existing = new Set();
  for (let page = 1; page <= 20; page++) {
    const data = await call('GET', `users?page=${page}&per_page=100`);
    for (const user of data.users || []) if (user.email) existing.add(user.email.toLowerCase());
    if ((data.users || []).length < 100) break;
  }
  console.log('\nALTA DE CUENTAS CLOUDOPS EN SUPABASE AUTH\n');
  for (const account of accounts) {
    if (existing.has(account.email)) {
      console.log(`YA EXISTE: ${account.email} (no se modifica contraseña ni rol)`);
      continue;
    }
    const password = `${account.email.split('@')[0]}2026`;
    // Se respetan las contraseñas de prueba originales, NO aptas para producción.
    await call('POST', 'users', {
      email: account.email,
      password,
      email_confirm: true,
      user_metadata: { name: account.name, role: account.role },
    });
    console.log(`CREADA: ${account.email}`);
  }
  console.log('\nTerminado. Ya puedes iniciar CloudOps sin Google.');
  console.log('IMPORTANTE: retira SUPABASE_SERVICE_ROLE_KEY de .env tras el alta y cambia las contraseñas de prueba antes de producción.');
} catch (error) {
  console.error('No se pudo completar el alta:', error.message);
  process.exitCode = 1;
}
