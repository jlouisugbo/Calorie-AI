/**
 * Seed 7 days of plausible biomarker readings for a user.
 *
 *   USER_ID=<uuid> npx tsx scripts/seed-mock-biomarkers.ts
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USER_ID = process.env.USER_ID;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}
if (!USER_ID) {
  throw new Error('Set USER_ID=<uuid> for the user to seed');
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function jitter(base: number, range: number) {
  return Math.round((base + (Math.random() - 0.5) * range) * 10) / 10;
}

async function main() {
  const rows = [];
  for (let i = 6; i >= 0; i--) {
    const recordedAt = new Date(Date.now() - i * 86_400_000);
    rows.push({
      user_id: USER_ID,
      recorded_at: recordedAt.toISOString(),
      glucose_mg_dl: jitter(95, 18),
      resting_hr: Math.round(jitter(58, 6)),
      hrv_ms: Math.round(jitter(62, 14)),
      sleep_hours: jitter(7.2, 1.6),
      steps: Math.round(jitter(8500, 4000)),
      source: 'mock',
    });
  }

  const { error } = await sb.from('biomarkers').insert(rows);
  if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
  console.log(`Inserted ${rows.length} mock biomarker rows for user ${USER_ID}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
