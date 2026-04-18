import { supabase } from './client';
import type { MealLogInsertFields } from './tools/logmeal/meal-log-map';

export interface MealLogRow {
  id: string;
  user_id: string;
  description: string | null;
  photo_url: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  logged_at: string;
}

export async function insertMealLog(
  userId: string,
  fields: MealLogInsertFields,
): Promise<MealLogRow | null> {
  const { data, error } = await supabase
    .from('meal_logs')
    .insert({ user_id: userId, ...fields })
    .select()
    .single();

  if (error) {
    console.error('insertMealLog error:', error.message);
    return null;
  }
  return data as MealLogRow;
}

export async function listRecentMealLogs(
  userId: string,
  limit = 30,
): Promise<MealLogRow[]> {
  const { data, error } = await supabase
    .from('meal_logs')
    .select('*')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('listRecentMealLogs error:', error.message);
    return [];
  }
  return (data ?? []) as MealLogRow[];
}
