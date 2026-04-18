import { getServiceSupabase } from './server';

export interface PushTokenRow {
  user_id: string;
  expo_token: string;
  platform: string | null;
  updated_at: string;
}

export async function upsertPushToken(
  userId: string,
  expoToken: string,
  platform: string | null,
): Promise<void> {
  const sb = getServiceSupabase();
  const { error } = await sb.from('push_tokens').upsert(
    {
      user_id: userId,
      expo_token: expoToken,
      platform,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,expo_token' },
  );
  if (error) throw new Error(`push_tokens upsert failed: ${error.message}`);
}

export async function listAllPushTokens(): Promise<PushTokenRow[]> {
  const sb = getServiceSupabase();
  const { data, error } = await sb.from('push_tokens').select('*');
  if (error) throw new Error(`push_tokens list failed: ${error.message}`);
  return (data ?? []) as PushTokenRow[];
}

export async function getUserPushTokens(userId: string): Promise<PushTokenRow[]> {
  const sb = getServiceSupabase();
  const { data, error } = await sb
    .from('push_tokens')
    .select('*')
    .eq('user_id', userId);
  if (error) throw new Error(`push_tokens lookup failed: ${error.message}`);
  return (data ?? []) as PushTokenRow[];
}
