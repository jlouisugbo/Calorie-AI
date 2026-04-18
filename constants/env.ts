const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  throw new Error(
    'Missing EXPO_PUBLIC_ANTHROPIC_API_KEY — copy .env.example to .env and fill it in.'
  );
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY — copy .env.example to .env and fill it in.'
  );
}

export const ENV = {
  ANTHROPIC_API_KEY,
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL ?? '',
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} as const;

/**
 * Server-only Apify token. Must only be read from inside API routes
 * (app/api/*+api.ts) so it never gets bundled into the client.
 */
export function getApifyToken(): string {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error('Missing APIFY_TOKEN — set it in your server environment.');
  }
  return token;
}
