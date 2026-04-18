import { getServiceSupabase, requireServiceSupabase } from './server';

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
  if (!sb) return [];
  const { data, error } = await sb
    .from('biomarkers')
    .select('*')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.warn(`[biomarkers] lookup failed: ${error.message}`);
    return [];
  }
  return (data ?? []) as BiomarkerRow[];
}

export async function insertBiomarker(
  row: Omit<BiomarkerRow, 'id' | 'recorded_at'> & { recorded_at?: string },
): Promise<void> {
  const sb = requireServiceSupabase();
  const { error } = await sb.from('biomarkers').insert(row);
  if (error) throw new Error(`biomarkers insert failed: ${error.message}`);
}

export async function insertBiomarkers(
  rows: Array<Omit<BiomarkerRow, 'id'>>,
): Promise<void> {
  const sb = requireServiceSupabase();
  const { error } = await sb.from('biomarkers').insert(rows);
  if (error) throw new Error(`biomarkers insert failed: ${error.message}`);
}

export async function deleteBiomarkersBySource(
  userId: string,
  source: string,
): Promise<void> {
  const sb = requireServiceSupabase();
  const { error } = await sb
    .from('biomarkers')
    .delete()
    .eq('user_id', userId)
    .eq('source', source);
  if (error) throw new Error(`biomarkers delete failed: ${error.message}`);
}
