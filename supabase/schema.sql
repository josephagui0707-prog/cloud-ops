-- CloudOps - almacenamiento de simulaciones en Supabase
-- Este esquema está pensado para el prototipo académico.
-- Para producción, reemplaza estas políticas por autenticación real y políticas por usuario/organización.

create table if not exists public.cloudops_simulations (
  workspace_id text not null default 'cloudops-demo',
  id text not null,
  name text not null,
  simulation jsonb not null,
  failure_config jsonb null,
  budget_limit numeric null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, id)
);

create index if not exists cloudops_simulations_updated_idx
  on public.cloudops_simulations (workspace_id, updated_at desc);

alter table public.cloudops_simulations enable row level security;

-- Políticas abiertas SOLO para este prototipo con anon key.
-- Si luego usas Supabase Auth, cambia estas políticas para filtrar por auth.uid().
drop policy if exists "cloudops demo select" on public.cloudops_simulations;
drop policy if exists "cloudops demo insert" on public.cloudops_simulations;
drop policy if exists "cloudops demo update" on public.cloudops_simulations;
drop policy if exists "cloudops demo delete" on public.cloudops_simulations;

create policy "cloudops demo select"
  on public.cloudops_simulations for select
  to anon, authenticated
  using (true);

create policy "cloudops demo insert"
  on public.cloudops_simulations for insert
  to anon, authenticated
  with check (true);

create policy "cloudops demo update"
  on public.cloudops_simulations for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "cloudops demo delete"
  on public.cloudops_simulations for delete
  to anon, authenticated
  using (true);
