import { CloudUser } from '../types/auth';

// Datos simulados. En una implementación real, esta información nunca
// debe vivir en el cliente: la validación ocurriría en un backend
// (por ejemplo, contra Cognito, IAM Identity Center o una base de datos
// con contraseñas hasheadas).
export const mockUsers: CloudUser[] = [
  {
    id: 'usr-001',
    email: 'admin@cloudops.io',
    password: 'admin2026',
    name: 'Jordy Aguilar',
    role: 'Administrador',
    initials: 'RC',
  },
  {
    id: 'usr-002',
    email: 'jordy@cloudops.io',
    password: 'jordy2026',
    name: 'Jordy Aguilar',
    role: 'DevOps Engineer',
    initials: 'MS',
  },
  {
    id: 'usr-003',
    email: 'sandro@cloudops.io',
    password: 'sandro2026',
    name: 'Sandro Tucto',
    role: 'Analista Cloud',
    initials: 'VP',
  },
  {
    id: 'usr-004',
    email: 'victor@cloudops.io',
    password: 'victor2026',
    name: 'Victor Vargas',
    role: 'DevOps Engineer',
    initials: 'MS',
  },
  {
    id: 'usr-005',
    email: 'marco@cloudops.io',
    password: 'marco2026',
    name: 'Marco Escalante',
    role: 'Analista Cloud',
    initials: 'VP',
  },
  {
    id: 'usr-006',
    email: 'josue@cloudops.io',
    password: 'josue2026',
    name: 'Josue Pilco',
    role: 'DevOps Engineer',
    initials: 'MS',
  },
  {
    id: 'usr-007',
    email: 'hugo@cloudops.io',
    password: 'hugo2026',
    name: 'Hugo Cahua',
    role: 'Analista Cloud',
    initials: 'VP',
  },
];
