import { getServiceSupabase } from './server';

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

export async function getLatestBiomarkers(
  userId: string,
  limit = 7,
): Promise<BiomarkerRow[]> {
  const sb = getServiceSupabase();
  const { data, error } = await sb
    .from('biomarkers')
    .select('*')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`biomarkers lookup failed: ${error.message}`);
  return (data ?? []) as BiomarkerRow[];
}

export async function insertBiomarker(
  row: Omit<BiomarkerRow, 'id' | 'recorded_at'> & { recorded_at?: string },
): Promise<void> {
  const sb = getServiceSupabase();
  const { error } = await sb.from('biomarkers').insert(row);
  if (error) throw new Error(`biomarkers insert failed: ${error.message}`);
}
