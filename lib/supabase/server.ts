import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ENV } from '@/constants/env';
import { getSupabaseServiceRoleKey } from '@/constants/env';

let cached: SupabaseClient | null = null;

/**
 * Server-only Supabase client using the service role key. Do NOT import this
 * from client components — it must only be used inside `app/api/*+api.ts`.
 */
export function getServiceSupabase(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(ENV.SUPABASE_URL, getSupabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
