import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ENV } from '@/constants/env';

let cached: SupabaseClient | null = null;
let warned = false;

/**
 * Server-only Supabase client using the service role key. Returns null when
 * SUPABASE_SERVICE_ROLE_KEY is not configured so that agent tools can degrade
 * gracefully (no biomarker / calendar data) instead of crashing the request.
 *
 * Do NOT import this from client components — it must only be used inside
 * `app/api/*+api.ts` routes.
 */
export function getServiceSupabase(): SupabaseClient | null {
  if (cached) return cached;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    if (!warned) {
      warned = true;
      console.warn(
        '[supabase] SUPABASE_SERVICE_ROLE_KEY is not set — biomarker/calendar tools will return empty data.',
      );
    }
    return null;
  }
  cached = createClient(ENV.SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/**
 * Variant that throws — use only when an endpoint absolutely requires the
 * service role (e.g. `/api/biomarkers/seed` cannot work without it).
 */
export function requireServiceSupabase(): SupabaseClient {
  const sb = getServiceSupabase();
  if (!sb) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for this endpoint but is not set.',
    );
  }
  return sb;
}
