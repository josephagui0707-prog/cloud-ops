import type { CloudUser } from '../types/auth';

// Perfiles visibles: SIN CONTRASEÑAS. Supabase Auth valida las credenciales.
// Las cuentas se provisionan una sola vez mediante scripts/configurar-usuarios.mjs.
export const mockUsers: CloudUser[] = [
  { id: 'usr-001', email: 'admin@cloudops.io', name: 'Jordy Aguilar', role: 'Administrador', initials: 'JA' },
  { id: 'usr-002', email: 'jordy@cloudops.io', name: 'Jordy Aguilar', role: 'DevOps Engineer', initials: 'JA' },
  { id: 'usr-003', email: 'sandro@cloudops.io', name: 'Sandro Tucto', role: 'Analista Cloud', initials: 'ST' },
  { id: 'usr-004', email: 'victor@cloudops.io', name: 'Victor Vargas', role: 'DevOps Engineer', initials: 'VV' },
  { id: 'usr-005', email: 'marco@cloudops.io', name: 'Marco Escalante', role: 'Analista Cloud', initials: 'ME' },
  { id: 'usr-006', email: 'josue@cloudops.io', name: 'Josue Pilco', role: 'DevOps Engineer', initials: 'JP' },
  { id: 'usr-007', email: 'hugo@cloudops.io', name: 'Hugo Cahua', role: 'Analista Cloud', initials: 'HC' },
];
