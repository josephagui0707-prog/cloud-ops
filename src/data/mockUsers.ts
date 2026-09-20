import { CloudUser } from '../types/auth';

// Datos simulados. En una implementación real, esta información nunca
// debe vivir en el cliente: la validación ocurriría en un backend
// (por ejemplo, contra Cognito, IAM Identity Center o una base de datos
// con contraseñas hasheadas).
export const mockUsers: CloudUser[] = [
  {
    id: 'usr-001',
    email: 'admin@cloudops.io',
    password: 'Admin#2025',
    name: 'Renata Cabrera',
    role: 'Administrador',
    initials: 'RC',
  },
  {
    id: 'usr-002',
    email: 'devops@cloudops.io',
    password: 'DevOps#2025',
    name: 'Marco Salinas',
    role: 'DevOps Engineer',
    initials: 'MS',
  },
  {
    id: 'usr-003',
    email: 'analista@cloudops.io',
    password: 'Analista#2025',
    name: 'Valeria Ponce',
    role: 'Analista Cloud',
    initials: 'VP',
  },
];
