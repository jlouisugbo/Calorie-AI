import { getServiceSupabase } from './server';

export interface NotificationLogRow {
  id: string;
  user_id: string;
  sent_at: string;
  trigger: string;
  body: string;
  agent_trace: unknown;
}

export async function logNotification(args: {
  userId: string;
  trigger: string;
  body: string;
  agentTrace?: unknown;
}): Promise<void> {
  const sb = getServiceSupabase();
  const { error } = await sb.from('notifications_log').insert({
    user_id: args.userId,
    trigger: args.trigger,
    body: args.body,
    agent_trace: args.agentTrace ?? null,
  });
  if (error) throw new Error(`notifications_log insert failed: ${error.message}`);
}

export async function recentNotificationForTrigger(
  userId: string,
  trigger: string,
  withinMinutes: number,
): Promise<boolean> {
  const sb = getServiceSupabase();
  const since = new Date(Date.now() - withinMinutes * 60_000).toISOString();
  const { data, error } = await sb
    .from('notifications_log')
    .select('id')
    .eq('user_id', userId)
    .eq('trigger', trigger)
    .gte('sent_at', since)
    .limit(1);
  if (error) throw new Error(`notifications_log check failed: ${error.message}`);
  return (data ?? []).length > 0;
}

export async function setUserState(
  userId: string,
  patch: { last_lat?: number; last_lng?: number; last_seen?: string },
): Promise<void> {
  const sb = getServiceSupabase();
  const { error } = await sb.from('user_state').upsert(
    {
      user_id: userId,
      ...patch,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) throw new Error(`user_state upsert failed: ${error.message}`);
}

export interface UserStateRow {
  user_id: string;
  last_lat: number | null;
  last_lng: number | null;
  last_seen: string | null;
  updated_at: string;
}

export async function getUserState(userId: string): Promise<UserStateRow | null> {
  const sb = getServiceSupabase();
  const { data, error } = await sb
    .from('user_state')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(`user_state lookup failed: ${error.message}`);
  return (data as UserStateRow | null) ?? null;
}
