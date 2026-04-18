import { getServiceSupabase } from './server';

export interface UserProfile {
  user_id: string;
  goals: string[] | null;
  dietary_restrictions: string[] | null;
  activity_level: string | null;
  daily_calorie_target: number | null;
  timezone: string | null;
  display_name: string | null;
}

export async function getProfileServer(userId: string): Promise<UserProfile | null> {
  const sb = getServiceSupabase();
  const { data, error } = await sb
    .from('profiles')
    .select(
      'user_id, goals, dietary_restrictions, activity_level, daily_calorie_target, timezone, display_name',
    )
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(`profiles lookup failed: ${error.message}`);
  return (data as UserProfile | null) ?? null;
}

export async function upsertProfileServer(
  userId: string,
  patch: Partial<Omit<UserProfile, 'user_id'>>,
): Promise<void> {
  const sb = getServiceSupabase();
  const { error } = await sb
    .from('profiles')
    .upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' });
  if (error) throw new Error(`profiles upsert failed: ${error.message}`);
}
