import { z } from 'zod';
import {
  deleteBiomarkersBySource,
  insertBiomarkers,
} from '@/lib/supabase/biomarkers';
import { generateBusyProBiomarkers } from '@/lib/agent/sample-biomarkers';

const inputSchema = z.object({
  userId: z.string().uuid(),
  days: z.number().int().positive().max(30).optional(),
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonResponse(
      { error: 'Invalid input', details: parsed.error.flatten() },
      400,
    );
  }

  const { userId, days } = parsed.data;

  try {
    await deleteBiomarkersBySource(userId, 'demo');
    const rows = generateBusyProBiomarkers(userId, days ?? 7);
    await insertBiomarkers(rows);
    return jsonResponse({ inserted: rows.length, latest: rows[0] });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Seeding biomarkers failed';
    return jsonResponse({ error: message }, 500);
  }
}
