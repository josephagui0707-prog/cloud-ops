-- Ejecutar en Supabase SQL Editor una sola vez. Informes privados por usuario autenticado.
-- No se suben ZIP ni código fuente a Supabase: solo resultados, rutas y metadatos saneados.
create table if not exists public.cloudops_ai_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  project_sha256 text not null,
  scenario text not null default 'auto',
  model text not null,
  result jsonb not null,
  report text not null,
  created_at timestamptz not null default now()
);
create index if not exists cloudops_ai_user_history_idx on public.cloudops_ai_analyses(user_id,created_at desc);
alter table public.cloudops_ai_analyses enable row level security;
revoke all on public.cloudops_ai_analyses from anon;
grant select, insert, delete on public.cloudops_ai_analyses to authenticated;
drop policy if exists "ai_read_own" on public.cloudops_ai_analyses;
drop policy if exists "ai_insert_own" on public.cloudops_ai_analyses;
drop policy if exists "ai_delete_own" on public.cloudops_ai_analyses;
create policy "ai_read_own" on public.cloudops_ai_analyses for select to authenticated using ((select auth.uid()) = user_id);
create policy "ai_insert_own" on public.cloudops_ai_analyses for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "ai_delete_own" on public.cloudops_ai_analyses for delete to authenticated using ((select auth.uid()) = user_id);
-- No política UPDATE: los resultados terminados no se alteran.
