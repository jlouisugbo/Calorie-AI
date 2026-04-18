-- Biomarkers demo guarantee
--
-- The biomarkers table is created in 0001_agent_layer.sql. This file
-- re-asserts the schema idempotently and adds a useful index on (user_id,
-- source) so that the /api/biomarkers/seed endpoint can wipe and reinsert
-- demo rows efficiently.
--
-- Apply with `supabase db push` or paste into the Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.biomarkers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  recorded_at timestamptz default now(),
  glucose_mg_dl numeric,
  resting_hr int,
  hrv_ms int,
  sleep_hours numeric,
  steps int,
  source text default 'mock'
);

create index if not exists biomarkers_user_recorded_idx
  on public.biomarkers (user_id, recorded_at desc);

create index if not exists biomarkers_user_source_idx
  on public.biomarkers (user_id, source);

alter table public.biomarkers enable row level security;

drop policy if exists "Users manage own biomarkers" on public.biomarkers;
create policy "Users manage own biomarkers" on public.biomarkers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
