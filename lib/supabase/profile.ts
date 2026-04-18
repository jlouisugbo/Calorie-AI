import { supabase } from './client';
import type { Profile, OnboardingData } from './types';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data as Profile;
}

export async function upsertProfile(
  userId: string,
  data: Partial<OnboardingData>
): Promise<Profile | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .upsert({ user_id: userId, ...data }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('upsertProfile error:', error.message);
    return null;
  }
  return profile as Profile;
}
