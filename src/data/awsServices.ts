import { Cpu, HardDrive, Database, Shield, Network, Route, Globe2 } from 'lucide-react';

export const awsServices = [
  ['EC2', 'Compute', 'Servidores virtuales escalables', Cpu],
  ['S3', 'Storage', 'Almacenamiento de objetos', HardDrive],
  ['RDS', 'Database', 'Base de datos relacional administrada', Database],
  ['IAM', 'Security', 'Gestión de identidades y accesos', Shield],
  ['VPC', 'Networking', 'Red virtual privada', Network],
  ['Route 53', 'Networking', 'DNS escalable y disponible', Route],
  ['CloudFront', 'Networking', 'Red de distribución de contenido', Globe2],
] as const;

export const awsServiceDetails = awsServices.map(([name, category, description]) => ({ name, category, description }));
