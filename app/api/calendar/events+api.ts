import { z } from 'zod';
import { listUpcomingEvents } from '@/lib/google/calendar';

const inputSchema = z.object({
  userId: z.string().uuid(),
  hoursAhead: z.number().int().positive().max(168).optional(),
  maxResults: z.number().int().positive().max(50).optional(),
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
    const events = await listUpcomingEvents(
      parsed.data.userId,
      parsed.data.hoursAhead ?? 24,
      parsed.data.maxResults ?? 10,
    );
    return jsonResponse({ events });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Calendar fetch failed';
    return jsonResponse({ error: message, events: [] }, 200);
  }
}
