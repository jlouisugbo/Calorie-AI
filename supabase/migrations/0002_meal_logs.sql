-- meal_logs: LogMeal pipeline output per scan
-- Run with: supabase db push  (or paste into the SQL editor)

create extension if not exists "pgcrypto";

create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  description text,
  photo_url text,
  calories integer,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  logged_at timestamptz default now()
);

create index if not exists meal_logs_user_logged_idx
  on public.meal_logs (user_id, logged_at desc);

alter table public.meal_logs enable row level security;
drop policy if exists "Users manage own meal logs" on public.meal_logs;
create policy "Users manage own meal logs" on public.meal_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
