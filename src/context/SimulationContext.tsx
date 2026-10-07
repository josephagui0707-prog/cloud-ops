import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import {
  deleteCloudSimulation,
  fetchCloudSimulations,
  upsertCloudSimulation,
} from '../lib/supabaseStorage';

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
  id: string;
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
  updatedAt: string;
};

type StoredSimulationState = {
  version: number;
  simulations: Simulation[];
  activeSimulationId: string | null;
};

type SimulationContextValue = {
  cloudReady: boolean;
  /*
   * Compatibilidad con el código actual.
   *
   * `simulation` siempre representa
   * la simulación activa.
   */
  simulation: Simulation | null;

  /*
   * Nueva estructura:
   * todas las planificaciones disponibles.
   */
  simulations: Simulation[];

  /*
   * Identificador de la planificación activa.
   */
  activeSimulationId: string | null;

  /*
   * Alias más descriptivo para futuras páginas.
   */
  activeSimulation: Simulation | null;

  /*
   * Compatibilidad con el Planning actual.
   *
   * Si ya existe una simulación activa,
   * actualiza esa simulación.
   *
   * Si no existe una activa,
   * crea una nueva.
   */
  saveSimulation: (
    simulation: SimulationInput
  ) => Simulation;

  /*
   * Crear siempre una nueva planificación.
   */
  createSimulation: (
    simulation: SimulationInput
  ) => Simulation;

  /*
   * Actualizar una planificación existente.
   */
  updateSimulation: (
    id: string,
    changes: Partial<SimulationInput>
  ) => Simulation | null;

  /*
   * Cambiar de planificación activa.
   */
  setActiveSimulation: (
    id: string
  ) => void;

  /*
   * Eliminar una planificación.
   *
   * Si era la activa, selecciona
   * automáticamente otra disponible.
   */
  deleteSimulation: (
    id: string
  ) => Promise<void>;

  /*
   * Duplicar una planificación.
   */
  duplicateSimulation: (
    id: string
  ) => Simulation | null;

  /*
   * Compatibilidad con Dashboard actual.
   *
   * Elimina solamente la simulación activa.
   */
  clearSimulation: () => void;
};

/*
 * `Planning.tsx` todavía genera el objeto
 * sin id ni updatedAt.
 *
 * Por eso dejamos esos campos como
 * responsabilidad interna del Context.
 */
export type SimulationInput = Omit<
  Simulation,
  'id' | 'updatedAt'
> & {
  id?: string;
  updatedAt?: string;
};

const SimulationContext =
  createContext<
    SimulationContextValue | undefined
  >(undefined);

const STORAGE_KEY =
  'cloudops-simulations-v1';

/*
 * Clave utilizada por la versión anterior
 * del proyecto.
 *
 * Se mantiene únicamente para realizar
 * la migración automática.
 */
const LEGACY_STORAGE_KEY =
  'cloudops-current-simulation-v3';

const STORAGE_VERSION = 1;

/* -------------------------------------------------------
 * Utilidades
 * ----------------------------------------------------- */

function generateId(): string {
  /*
   * `crypto.randomUUID()` está disponible
   * en navegadores modernos.
   *
   * El fallback evita romper la aplicación
   * en entornos donde no exista.
   */
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `simulation-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null
  );
}

function normalizeCostItem(
  value: unknown
): SimulationCostItem | null {
  if (!isObject(value)) {
    return null;
  }

  const service =
    typeof value.service === 'string'
      ? value.service
      : '';

  if (!service) {
    return null;
  }

  return {
    service,

    detail:
      typeof value.detail === 'string'
        ? value.detail
        : '',

    quantity:
      typeof value.quantity === 'number'
        ? value.quantity
        : Number(value.quantity) || 0,

    usage:
      typeof value.usage === 'string'
        ? value.usage
        : '',

    rate:
      typeof value.rate === 'number'
        ? value.rate
        : Number(value.rate) || 0,

    unit:
      typeof value.unit === 'string'
        ? value.unit
        : '',

    monthly:
      typeof value.monthly === 'number'
        ? value.monthly
        : Number(value.monthly) || 0,
  };
}

function normalizeSimulation(
  value: unknown,
  fallbackId?: string
): Simulation | null {
  if (!isObject(value)) {
    return null;
  }

  if (
    typeof value.name !== 'string' ||
    typeof value.region !== 'string'
  ) {
    return null;
  }

  const costItems = Array.isArray(
    value.costItems
  )
    ? value.costItems
        .map(normalizeCostItem)
        .filter(
          (
            item
          ): item is SimulationCostItem =>
            item !== null
        )
    : [];

  const selectedServices =
    Array.isArray(
      value.selectedServices
    )
      ? value.selectedServices.filter(
          (
            service
          ): service is string =>
            typeof service === 'string'
        )
      : [];

  const id =
    typeof value.id === 'string' &&
    value.id.trim()
      ? value.id
      : fallbackId ?? generateId();

  const createdAt =
    typeof value.createdAt === 'string' &&
    value.createdAt
      ? value.createdAt
      : nowIso();

  const updatedAt =
    typeof value.updatedAt === 'string' &&
    value.updatedAt
      ? value.updatedAt
      : createdAt;

  return {
    id,

    name: value.name,

    type:
      typeof value.type === 'string'
        ? value.type
        : 'Aplicación web empresarial',

    region: value.region,

    users:
      typeof value.users === 'number'
        ? Math.max(0, value.users)
        : Number(value.users) || 0,

    availability:
      typeof value.availability === 'string'
        ? value.availability
        : 'Estándar',

    objective:
      typeof value.objective === 'string'
        ? value.objective
        : '',

    description:
      typeof value.description === 'string'
        ? value.description
        : '',

    selectedServices,

    costItems,

    monthlyCost:
      typeof value.monthlyCost === 'number'
        ? value.monthlyCost
        : Number(value.monthlyCost) || 0,

    annualCost:
      typeof value.annualCost === 'number'
        ? value.annualCost
        : Number(value.annualCost) || 0,

    createdAt,

    updatedAt,
  };
}

function createSimulationFromInput(
  input: SimulationInput,
  forcedId?: string
): Simulation {
  const timestamp = nowIso();

  return {
    id:
      forcedId ??
      input.id ??
      generateId(),

    name: input.name,

    type: input.type,

    region: input.region,

    users: input.users,

    availability:
      input.availability,

    objective: input.objective,

    description:
      input.description,

    selectedServices:
      [...input.selectedServices],

    costItems:
      input.costItems.map(
        (item) => ({
          ...item,
        })
      ),

    monthlyCost:
      input.monthlyCost,

    annualCost:
      input.annualCost,

    createdAt:
      input.createdAt ??
      timestamp,

    updatedAt:
      timestamp,
  };
}

/*
 * Si existe información de la versión nueva,
 * la cargamos.
 *
 * Si todavía no existe, buscamos la antigua
 * simulación única y la migramos.
 */
function loadStoredState(): StoredSimulationState {
  return { version: STORAGE_VERSION, simulations: [], activeSimulationId: null };
}

/* -------------------------------------------------------
 * Provider
 * ----------------------------------------------------- */

export function SimulationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const initialState = useMemo(
    () => loadStoredState(),
    []
  );

  const [
    simulations,
    setSimulations,
  ] = useState<Simulation[]>(
    initialState.simulations
  );

  const [
    activeSimulationId,
    setActiveSimulationId,
  ] = useState<
    string | null
  >(
    initialState.activeSimulationId
  );

  const [cloudReady, setCloudReady] = useState(false);
  const cloudLoadStarted = useRef(false);
  const persisted = useRef(new Map<string, string>());

  useEffect(() => {
    if (cloudLoadStarted.current) return;
    cloudLoadStarted.current = true;
    void fetchCloudSimulations().then(items => {
      const normalized = items.map(item => normalizeSimulation(item)).filter((item): item is Simulation => item !== null);
      persisted.current = new Map(normalized.map(item => [item.id, JSON.stringify(item)]));
      setSimulations(normalized);
      setActiveSimulationId(normalized[0]?.id ?? null);
      setCloudReady(true);
    }).catch(error => toast.error(`No se pudieron cargar las simulaciones: ${error.message}. Revisa Supabase y recarga la página.`));
  }, []);

  /*
   * Simulación activa.
   */
  const activeSimulation =
    useMemo(() => {
      if (!activeSimulationId) {
        return null;
      }

      return (
        simulations.find(
          (item) =>
            item.id ===
            activeSimulationId
        ) ?? null
      );
    }, [
      simulations,
      activeSimulationId,
    ]);

  /*
   * Compatibilidad.
   *
   * Todos los módulos actuales que hacen:
   *
   * const { simulation } = useSimulation();
   *
   * seguirán funcionando.
   */
  const simulation =
    activeSimulation;

  // La base remota es la única persistencia. Los cambios en memoria se confirman al guardar.
  useEffect(() => {
    if (!cloudReady) return;
    const changed = simulations.filter(item => persisted.current.get(item.id) !== JSON.stringify(item));
    if (!changed.length) return;
    void Promise.all(changed.map(async item => {
      await upsertCloudSimulation(item);
      persisted.current.set(item.id, JSON.stringify(item));
    })).then(() => toast.success('Simulación guardada en Supabase.')).catch(error => {
      toast.error(`No se guardaron los cambios en Supabase: ${error.message}. Conserva esta página y vuelve a guardar.`);
    });
  }, [simulations, cloudReady]);

  /*
   * Si después de eliminar una simulación
   * la activa deja de existir, seleccionamos
   * otra automáticamente.
   */
  useEffect(() => {
    if (
      activeSimulationId &&
      simulations.some(
        (item) =>
          item.id ===
          activeSimulationId
      )
    ) {
      return;
    }

    if (simulations.length > 0) {
      setActiveSimulationId(
        simulations[0].id
      );
    } else {
      setActiveSimulationId(null);
    }
  }, [
    simulations,
    activeSimulationId,
  ]);

  /*
   * Crear nueva planificación.
   */
  const createSimulation = (
    input: SimulationInput
  ): Simulation => {
    if (!cloudReady) throw new Error("Supabase aún no está disponible. Revisa la configuración y recarga.");
    const next =
      createSimulationFromInput(
        input
      );

    setSimulations(
      (current) => [
        ...current,
        next,
      ]
    );

    /*
     * La nueva planificación
     * pasa a ser la activa.
     */
    setActiveSimulationId(
      next.id
    );

    return next;
  };

  /*
   * Actualizar una planificación existente.
   */
  const updateSimulation = (
    id: string,
    changes: Partial<SimulationInput>
  ): Simulation | null => {
    if (!cloudReady) throw new Error("Supabase aún no está disponible. Revisa la configuración y recarga.");
    let updated:
      | Simulation
      | null = null;

    setSimulations(
      (current) =>
        current.map((item) => {
          if (item.id !== id) {
            return item;
          }

          updated = {
            ...item,

            ...changes,

            /*
             * Evita que una actualización
             * accidental reemplace el ID.
             */
            id: item.id,

            /*
             * La fecha de creación se conserva.
             */
            createdAt:
              item.createdAt,

            /*
             * Actualización real.
             */
            updatedAt:
              nowIso(),

            /*
             * Clonamos arrays para
             * evitar referencias compartidas.
             */
            selectedServices:
              changes.selectedServices
                ? [
                    ...changes.selectedServices,
                  ]
                : [
                    ...item.selectedServices,
                  ],

            costItems:
              changes.costItems
                ? changes.costItems.map(
                    (costItem) => ({
                      ...costItem,
                    })
                  )
                : item.costItems.map(
                    (costItem) => ({
                      ...costItem,
                    })
                  ),
          };

          return updated;
        })
    );

    return updated;
  };

  /*
   * Guardado compatible con Planning
   * y con los archivos actuales.
   *
   * Caso 1:
   * existe un ID -> actualizamos esa
   * planificación.
   *
   * Caso 2:
   * no existe un ID pero existe una
   * planificación activa -> actualizamos
   * la activa.
   *
   * Caso 3:
   * no existe ninguna activa -> creamos
   * una nueva.
   */
  const saveSimulation = (
    input: SimulationInput
  ): Simulation => {
    if (!cloudReady) throw new Error("Supabase aún no está disponible. Revisa la configuración y recarga.");
    const explicitId =
      input.id;

    if (explicitId) {
      const existing =
        simulations.find(
          (item) =>
            item.id ===
            explicitId
        );

      if (existing) {
        const updated =
          createSimulationFromInput(
            {
              ...existing,
              ...input,
              id: existing.id,
              createdAt:
                existing.createdAt,
            },
            existing.id
          );

        setSimulations(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                existing.id
                  ? {
                      ...updated,
                      updatedAt:
                        nowIso(),
                    }
                  : item
            )
        );

        setActiveSimulationId(
          existing.id
        );

        return updated;
      }
    }

    /*
     * Si el Planning actual no envía ID,
     * actualizamos la simulación activa.
     */
    if (
      activeSimulation
    ) {
      const updated =
        createSimulationFromInput(
          {
            ...activeSimulation,
            ...input,
            id:
              activeSimulation.id,
            createdAt:
              activeSimulation.createdAt,
          },
          activeSimulation.id
        );

      const finalSimulation: Simulation =
        {
          ...updated,
          id:
            activeSimulation.id,
          createdAt:
            activeSimulation.createdAt,
          updatedAt:
            nowIso(),
        };

      setSimulations(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              activeSimulation.id
                ? finalSimulation
                : item
          )
      );

      setActiveSimulationId(
        activeSimulation.id
      );

      return finalSimulation;
    }

    /*
     * No existe una simulación activa:
     * creamos una.
     */
    return createSimulation(
      input
    );
  };

  /*
   * Cambiar planificación activa.
   */
  const setActiveSimulation = (
    id: string
  ) => {
    const exists =
      simulations.some(
        (item) =>
          item.id === id
      );

    if (!exists) {
      return;
    }

    setActiveSimulationId(id);
  };

  /*
   * Eliminar una planificación.
   */
  const deleteSimulation = async (
    id: string
  ) => {
    if (!cloudReady) throw new Error("Supabase no está disponible.");
    await deleteCloudSimulation(id);
    persisted.current.delete(id);

    setSimulations(
      (current) =>
        current.filter(
          (item) =>
            item.id !== id
        )
    );

    /*
     * Si eliminamos la activa,
     * elegimos otra posteriormente.
     *
     * Aquí se intenta seleccionar
     * la primera disponible.
     */
    if (
      id ===
      activeSimulationId
    ) {
      const remaining =
        simulations.filter(
          (item) =>
            item.id !== id
        );

      setActiveSimulationId(
        remaining[0]?.id ??
          null
      );
    }
  };

  /*
   * Duplicar planificación.
   */
  const duplicateSimulation = (
    id: string
  ): Simulation | null => {
    if (!cloudReady) throw new Error("Supabase aún no está disponible. Revisa la configuración y recarga.");
    const original =
      simulations.find(
        (item) =>
          item.id === id
      );

    if (!original) {
      return null;
    }

    const duplicate =
      createSimulationFromInput({
        ...original,

        /*
         * Nuevo nombre para
         * diferenciar el escenario.
         */
        name: `${original.name} - Copia`,

        /*
         * Quitamos el ID para que
         * se genere uno nuevo.
         */
        id: undefined,

        /*
         * Preservamos la fecha
         * de origen como referencia,
         * pero el nuevo escenario
         * tendrá su propio updatedAt.
         */
        createdAt:
          nowIso(),
      });

    setSimulations(
      (current) => [
        ...current,
        duplicate,
      ]
    );

    setActiveSimulationId(
      duplicate.id
    );

    return duplicate;
  };

  /*
   * Compatibilidad con el Dashboard actual.
   *
   * El botón:
   *
   * "Eliminar simulación"
   *
   * elimina la planificación activa,
   * NO todas las planificaciones.
   */
  const clearSimulation =
    () => {
      if (!activeSimulationId) {
        return;
      }

      void deleteSimulation(activeSimulationId).catch(error => toast.error(`No se pudo eliminar: ${error.message}`));
    };

  const value =
    useMemo<SimulationContextValue>(
      () => ({
        cloudReady,
        simulation,

        simulations,

        activeSimulationId,

        activeSimulation,

        saveSimulation,

        createSimulation,

        updateSimulation,

        setActiveSimulation,

        deleteSimulation,

        duplicateSimulation,

        clearSimulation,
      }),
      [
        cloudReady,
        simulation,
        simulations,
        activeSimulationId,
        activeSimulation,
      ]
    );

  return (
    <SimulationContext.Provider
      value={value}
    >
      {children}
    </SimulationContext.Provider>
  );
}

/* -------------------------------------------------------
 * Hook
 * ----------------------------------------------------- */

export function useSimulation() {
  const context =
    useContext(
      SimulationContext
    );

  if (!context) {
    throw new Error(
      'useSimulation debe utilizarse dentro de SimulationProvider'
    );
  }

  return context;
}