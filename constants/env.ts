const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const LOGMEAL_API_KEY = process.env.EXPO_PUBLIC_LOGMEAL_API_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY — copy .env.example to .env and fill it in.'
  );
}

if (!LOGMEAL_API_KEY) {
  throw new Error(
    'Missing EXPO_PUBLIC_LOGMEAL_API_KEY — copy .env.example to .env and fill it in.'
  );
}

export const ENV = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL ?? '',
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  LOGMEAL_API_KEY,
} as const;

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing ${name} — set it in your server environment.`);
  }
  return value;
}

/**
 * Server-only Apify token. Must only be read from inside API routes
 * (app/api/*+api.ts) so it never gets bundled into the client.
 */
export function getApifyToken(): string {
  return required(process.env.APIFY_TOKEN, 'APIFY_TOKEN');
}

/** Server-only Anthropic API key. */
export function getAnthropicApiKey(): string {
  return required(process.env.ANTHROPIC_API_KEY, 'ANTHROPIC_API_KEY');
}

/** Server-only OpenAI API key (used for Realtime voice sessions). */
export function getOpenAIApiKey(): string {
  return required(process.env.OPENAI_API_KEY, 'OPENAI_API_KEY');
}

/** Server-only Supabase service role key. */
export function getSupabaseServiceRoleKey(): string {
  return required(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    'SUPABASE_SERVICE_ROLE_KEY',
  );
}

/** Server-only Google OAuth client secret. */
export function getGoogleOAuthClientSecret(): string {
  return required(
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    'GOOGLE_OAUTH_CLIENT_SECRET',
  );
}

/** Server-only Google OAuth client id (also exposed publicly for the PKCE flow). */
export function getGoogleOAuthClientId(): string {
  return (
    process.env.GOOGLE_OAUTH_CLIENT_ID ??
    process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID ??
    ''
  );
}

/** Optional shared secret to gate the cron route. */
export function getCronSecret(): string | null {
  return process.env.CRON_SECRET ?? null;
}
