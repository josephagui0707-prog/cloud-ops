import type { Simulation } from '../context/SimulationContext';
import type { LabConfig } from '../operations/model';

type CloudSimulationRow = {
  workspace_id: string;
  id: string;
  name: string;
  simulation: Simulation;
  failure_config: LabConfig | null;
  budget_limit: number | null;
  created_at: string;
  updated_at: string;
};

type SimulationExtras = {
  failureConfig?: LabConfig | null;
  budgetLimit?: number | null;
};

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '');
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const WORKSPACE_ID = (import.meta.env.VITE_SUPABASE_WORKSPACE_ID as string | undefined)?.trim() || 'cloudops-demo';

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function headers(extra?: Record<string, string>): HeadersInit {
  return {
    apikey: SUPABASE_ANON_KEY || '',
    Authorization: `Bearer ${SUPABASE_ANON_KEY || ''}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  if (!supabaseConfigured || !SUPABASE_URL) {
    throw new Error('Supabase no está configurado.');
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      ...headers(),
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Supabase ${response.status}: ${detail || response.statusText}`);
  }

  return response;
}

export async function fetchCloudSimulationRows(): Promise<CloudSimulationRow[]> {
  if (!supabaseConfigured) return [];

  const query = new URLSearchParams({
    select: 'workspace_id,id,name,simulation,failure_config,budget_limit,created_at,updated_at',
    workspace_id: `eq.${WORKSPACE_ID}`,
    order: 'updated_at.desc',
  });

  const response = await request(`cloudops_simulations?${query.toString()}`);
  const rows = (await response.json()) as CloudSimulationRow[];
  return Array.isArray(rows) ? rows : [];
}

export async function fetchCloudSimulations(): Promise<Simulation[]> {
  const rows = await fetchCloudSimulationRows();
  return rows
    .map((row) => row.simulation)
    .filter((simulation): simulation is Simulation => Boolean(simulation && simulation.id));
}

export async function upsertCloudSimulation(
  simulation: Simulation,
  extras: SimulationExtras = {}
): Promise<void> {
  if (!supabaseConfigured) return;

  const body: Record<string, unknown> = {
    workspace_id: WORKSPACE_ID,
    id: simulation.id,
    name: simulation.name,
    simulation,
    created_at: simulation.createdAt,
    updated_at: simulation.updatedAt,
  };

  if ('failureConfig' in extras) body.failure_config = extras.failureConfig ?? null;
  if ('budgetLimit' in extras) body.budget_limit = extras.budgetLimit ?? null;

  await request('cloudops_simulations?on_conflict=workspace_id%2Cid', {
    method: 'POST',
    headers: headers({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify(body),
  });
}

export async function deleteCloudSimulation(id: string): Promise<void> {
  if (!supabaseConfigured) return;

  const query = new URLSearchParams({
    workspace_id: `eq.${WORKSPACE_ID}`,
    id: `eq.${id}`,
  });

  await request(`cloudops_simulations?${query.toString()}`, {
    method: 'DELETE',
    headers: headers({ Prefer: 'return=minimal' }),
  });
}
