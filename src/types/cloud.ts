export interface CloudProject {
  name: string;
  applicationType: string;
  region: string;
  users: number;
  availability: string;
  objective: string;
  services: string[];
}

export interface CloudService {
  name: string;
  category: string;
  description: string;
}

export interface CostItem {
  service: string;
  quantity: number;
  unitPrice: number;
  monthly: number;
}

export interface SecurityControl {
  id: string;
  domain: string;
  name: string;
  status: 'correcto' | 'revision' | 'critico';
}

export interface CloudRegion {
  name: string;
  code: string;
  status: 'operativa' | 'planificada';
  services: string[];
}

export interface NetworkNode {
  id: string;
  label: string;
  type: string;
  zone?: string;
}
