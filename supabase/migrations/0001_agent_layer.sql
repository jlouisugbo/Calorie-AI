-- Calorie-AI agent layer schema
-- Run with: supabase db push  (or paste into the SQL editor)

create extension if not exists "pgcrypto";

-- Profiles ---------------------------------------------------------------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users on delete cascade,
  display_name text,
  goals text[],
  dietary_restrictions text[],
  activity_level text,
  daily_calorie_target int,
  timezone text default 'America/Los_Angeles',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Biomarkers (mock for now, HealthKit later) ----------------------------
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

alter table public.biomarkers enable row level security;
drop policy if exists "Users manage own biomarkers" on public.biomarkers;
create policy "Users manage own biomarkers" on public.biomarkers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Google OAuth tokens ---------------------------------------------------
create table if not exists public.google_tokens (
  user_id uuid primary key references auth.users on delete cascade,
  access_token text,
  refresh_token text,
  expiry timestamptz,
  scope text,
  updated_at timestamptz default now()
);

alter table public.google_tokens enable row level security;
drop policy if exists "Users read own google tokens" on public.google_tokens;
-- Tokens are only ever written server-side via the service role; reads
-- from the client are limited to existence checks (no token leakage).
create policy "Users read own google tokens" on public.google_tokens
  for select using (auth.uid() = user_id);

-- Expo push tokens ------------------------------------------------------
create table if not exists public.push_tokens (
  user_id uuid not null references auth.users on delete cascade,
  expo_token text not null,
  platform text,
  updated_at timestamptz default now(),
  primary key (user_id, expo_token)
);

alter table public.push_tokens enable row level security;
drop policy if exists "Users manage own push tokens" on public.push_tokens;
create policy "Users manage own push tokens" on public.push_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Notification audit log ------------------------------------------------
create table if not exists public.notifications_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  sent_at timestamptz default now(),
  trigger text not null,
  body text not null,
  agent_trace jsonb
);
create index if not exists notifications_log_user_sent_idx
  on public.notifications_log (user_id, sent_at desc);

alter table public.notifications_log enable row level security;
drop policy if exists "Users read own notifications" on public.notifications_log;
create policy "Users read own notifications" on public.notifications_log
  for select using (auth.uid() = user_id);

-- Last-known location / liveness for the proactive cron -----------------
create table if not exists public.user_state (
  user_id uuid primary key references auth.users on delete cascade,
  last_lat double precision,
  last_lng double precision,
  last_seen timestamptz,
  updated_at timestamptz default now()
);

alter table public.user_state enable row level security;
drop policy if exists "Users read own state" on public.user_state;
create policy "Users read own state" on public.user_state
  for select using (auth.uid() = user_id);
