import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useSimulation, type Simulation } from '../context/SimulationContext';
import { fetchCloudSimulationRows, supabaseConfigured, patchCloudOperations } from '../lib/supabaseStorage';
import { budgetLevel, defaultLab, differences, type LabConfig } from './model';

export type Revision = {
  id: string;
  scenarioId: string;
  name: string;
  at: string;
  actor: string;
  action: string;
  snapshot?: Simulation;
};

type Store = {
  budgets: Record<string, number>;
  labs: Record<string, LabConfig>;
  history: Revision[];
};

const KEY = 'cloudops-operations-v1';
const empty: Store = { budgets: {}, labs: {}, history: [] };
const failures = ['none', 'server', 'zone', 'database', 'cpu', 'connections', 'storage', 'cdn', 'dns'];

function normalizeLab(value: unknown): LabConfig | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<LabConfig>;
  if (!candidate.failure || !failures.includes(candidate.failure)) return null;
  return {
    failure: candidate.failure,
    secondServer: Boolean(candidate.secondServer),
    standbyDatabase: Boolean(candidate.standbyDatabase),
  };
}

function load(): Store { return { budgets: {}, labs: {}, history: [] }; }

type Value = Store & {
  setBudget: (id: string, limit: number | null) => void;
  setLab: (id: string, config: LabConfig) => void;
  storageError: boolean;
};

const Context = createContext<Value | null>(null);

export function OperationsProvider({ children }: { children: ReactNode }) {
  const { simulations, simulation } = useSimulation();
  const { user } = useAuth();
  const [data, setData] = useState(load);
  const [storageError, setStorageError] = useState(false);
  const previous = useRef(simulations);
  const first = useRef(true);
  const alertLevels = useRef<Record<string, string>>({});
  const cloudLoadStarted = useRef(false);
  const actor = user ? `${user.name} (${user.email})` : 'Sesión sin identificar';

  /* Recupera de Supabase el presupuesto y el estado del simulador de fallos. */
  useEffect(() => {
    if (!supabaseConfigured || cloudLoadStarted.current) return;
    cloudLoadStarted.current = true;

    void fetchCloudSimulationRows()
      .then((rows) => {
        setData((current) => {
          const budgets = { ...current.budgets };
          const labs = { ...current.labs };

          for (const row of rows) {
            if (typeof row.budget_limit === 'number' && Number.isFinite(row.budget_limit) && row.budget_limit > 0) {
              budgets[row.id] = row.budget_limit;
            }
            const config = normalizeLab(row.failure_config);
            if (config) labs[row.id] = config;
          }

          return { ...current, budgets, labs };
        });
      })
      .catch((error) => {
        setStorageError(true); toast.error(`No se pudieron cargar los datos operativos: ${error.message}`);
      });
  }, []);

  useEffect(() => {
    const additions: Revision[] = [];
    const initial = first.current;
    const old = previous.current;

    // Advance refs before the state update, avoiding duplicate entries under StrictMode.
    first.current = false;
    previous.current = simulations;

    for (const s of simulations) {
      const before = old.find((x) => x.id === s.id);
      if (initial ? !data.history.some((r) => r.scenarioId === s.id) : !before || differences(before, s).length > 0) {
        additions.push({
          id: crypto.randomUUID(),
          scenarioId: s.id,
          name: s.name,
          at: new Date().toISOString(),
          actor: initial ? 'Carga desde Supabase' : actor,
          action: initial ? 'Versión inicial' : before ? 'Modificación' : 'Creación / copia',
          snapshot: structuredClone(s),
        });
      }
    }

    if (!initial) {
      for (const s of old) {
        if (!simulations.some((x) => x.id === s.id)) {
          additions.push({
            id: crypto.randomUUID(),
            scenarioId: s.id,
            name: s.name,
            at: new Date().toISOString(),
            actor,
            action: 'Eliminación',
          });
        }
      }
    }

    if (additions.length) {
      setData((d) => ({ ...d, history: [...additions.reverse(), ...d.history].slice(0, 500) }));
    }
  }, [simulations, actor]);

  useEffect(() => {
    if (!simulation) return;
    const level = budgetLevel(simulation.monthlyCost, data.budgets[simulation.id]);
    const key = `${user?.id || 'anonymous'}:${simulation.id}`;

    if (alertLevels.current[key] !== level) {
      if (level === 'critical') toast.error(`${simulation.name}: presupuesto alcanzado o superado`);
      if (level === 'warning') toast.warning(`${simulation.name}: estimación al 80 % o más del presupuesto`);
      alertLevels.current[key] = level;
    }
  }, [simulation, data.budgets, user?.id]);

  return (
    <Context.Provider
      value={{
        ...data,
        storageError,
        setBudget: (id, limit) => {
          if (limit !== null && (!Number.isFinite(limit) || limit <= 0)) return;

          setData((d) => {
            const budgets = { ...d.budgets };
            if (limit === null) delete budgets[id];
            else budgets[id] = limit;
            return { ...d, budgets };
          });

          const scenario = simulations.find((item) => item.id === id);
          if (scenario) {
            void patchCloudOperations(scenario.id, {
              failureConfig: data.labs[id] || defaultLab,
              budgetLimit: limit,
            }).catch((error) => {
              setStorageError(true); toast.error(`No se guardó el presupuesto: ${error.message}`);
            });
          }
        },
        setLab: (id, config) => {
          const nextConfig = { ...defaultLab, ...config };
          setData((d) => ({ ...d, labs: { ...d.labs, [id]: nextConfig } }));

          const scenario = simulations.find((item) => item.id === id);
          if (scenario) {
            void patchCloudOperations(scenario.id, {
              failureConfig: nextConfig,
              budgetLimit: data.budgets[id] ?? null,
            }).catch((error) => {
              setStorageError(true); toast.error(`No se guardó el escenario de fallos: ${error.message}`);
            });
          }
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useOperations() {
  const value = useContext(Context);
  if (!value) throw new Error('OperationsProvider no disponible');
  return value;
}
