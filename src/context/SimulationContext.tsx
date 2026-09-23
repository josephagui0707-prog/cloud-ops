import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type SimulationCostItem = {
  service: string;
  detail: string;
  quantity: number;
  usage: string;
  rate: number;
  unit: string;
  monthly: number;
};

export type Simulation = {
  name: string;
  type: string;
  region: string;
  users: number;
  availability: string;
  objective: string;
  description: string;
  selectedServices: string[];
  costItems: SimulationCostItem[];
  monthlyCost: number;
  annualCost: number;
  createdAt: string;
};

type SimulationContextValue = {
  simulation: Simulation | null;
  saveSimulation: (simulation: Simulation) => void;
  clearSimulation: () => void;
};

const SimulationContext = createContext<SimulationContextValue | undefined>(undefined);
const STORAGE_KEY = 'cloudops-current-simulation-v3';

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [simulation, setSimulation] = useState<Simulation | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (simulation) localStorage.setItem(STORAGE_KEY, JSON.stringify(simulation));
    else localStorage.removeItem(STORAGE_KEY);
  }, [simulation]);

  const value = useMemo(() => ({
    simulation,
    saveSimulation: (next: Simulation) => setSimulation(next),
    clearSimulation: () => setSimulation(null),
  }), [simulation]);

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) throw new Error('useSimulation debe utilizarse dentro de SimulationProvider');
  return context;
}
