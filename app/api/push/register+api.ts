import { z } from 'zod';
import { upsertPushToken } from '@/lib/supabase/push';

const inputSchema = z.object({
  userId: z.string().uuid(),
  expoToken: z.string().min(1),
  platform: z.string().optional().nullable(),
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
  try {
    await upsertPushToken(
      parsed.data.userId,
      parsed.data.expoToken,
      parsed.data.platform ?? null,
    );
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'Failed to register token' },
      500,
    );
  }
}
