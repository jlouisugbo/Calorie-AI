import { getServiceSupabase, requireServiceSupabase } from './server';

export interface GoogleTokenRow {
  user_id: string;
  access_token: string | null;
  refresh_token: string | null;
  expiry: string | null;
  scope: string | null;
}

export async function getGoogleTokens(
  userId: string,
): Promise<GoogleTokenRow | null> {
  const sb = getServiceSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('google_tokens')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(`google_tokens lookup failed: ${error.message}`);
  return (data as GoogleTokenRow | null) ?? null;
}

export async function upsertGoogleTokens(
  userId: string,
  patch: Partial<Omit<GoogleTokenRow, 'user_id'>>,
): Promise<void> {
  const sb = requireServiceSupabase();
  const { error } = await sb
    .from('google_tokens')
    .upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' });
  if (error) throw new Error(`google_tokens upsert failed: ${error.message}`);
}
