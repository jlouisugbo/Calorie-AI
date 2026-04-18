import type { BiomarkerRow } from '@/lib/supabase/biomarkers';

export type SampleBiomarkerRow = Omit<BiomarkerRow, 'id'>;

/**
 * Deterministic-ish busy-professional biomarker pattern:
 *   - Sleep 5.8–6.6 h (chronically under)
 *   - HRV 36–45 ms (suppressed)
 *   - Resting HR 64–70 bpm (slightly elevated)
 *   - Fasting glucose 95–112 mg/dL (mildly impaired)
 *   - Steps 3.2k–5.4k (sedentary)
 *
 * Today's value is the most "stressed" — sleep 6.2, HRV 38, glucose 105 —
 * so the AI has something concrete to reason about.
 */
export function generateBusyProBiomarkers(
  userId: string,
  days = 7,
): SampleBiomarkerRow[] {
  const sleep = [6.2, 5.8, 6.5, 6.0, 6.6, 5.9, 6.4];
  const hrv = [38, 36, 41, 39, 45, 37, 42];
  const rhr = [68, 70, 65, 67, 64, 69, 66];
  const glucose = [105, 109, 98, 112, 95, 108, 101];
  const steps = [3800, 3200, 5400, 4100, 4800, 3500, 4400];

  const rows: SampleBiomarkerRow[] = [];
  const now = new Date();
  now.setHours(7, 30, 0, 0);

  for (let i = 0; i < days; i++) {
    const recordedAt = new Date(now);
    recordedAt.setDate(recordedAt.getDate() - i);
    const idx = i % sleep.length;
    rows.push({
      user_id: userId,
      recorded_at: recordedAt.toISOString(),
      glucose_mg_dl: glucose[idx],
      resting_hr: rhr[idx],
      hrv_ms: hrv[idx],
      sleep_hours: sleep[idx],
      steps: steps[idx],
      source: 'demo',
    });
  }

  return rows;
}
