import { supabase } from './client';

export interface BiomarkerRow {
  id: string;
  user_id: string;
  recorded_at: string;
  glucose_mg_dl: number | null;
  resting_hr: number | null;
  hrv_ms: number | null;
  sleep_hours: number | null;
  steps: number | null;
  source: string | null;
}

export async function getLatestBiomarkersClient(
  userId: string,
  limit = 7,
): Promise<BiomarkerRow[]> {
  const { data, error } = await supabase
    .from('biomarkers')
    .select('*')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('biomarkers client lookup failed:', error.message);
    return [];
  }
  return (data ?? []) as BiomarkerRow[];
}
