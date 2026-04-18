import { z } from 'zod';
import { searchNearbyPlaces } from '@/lib/places/server';

const inputSchema = z.object({
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
  query: z.string().trim().min(1).max(120).optional(),
  radiusKm: z.number().positive().max(25).optional(),
  limit: z.number().int().positive().max(20).optional(),
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      { error: 'Invalid input', details: parsed.error.flatten() },
      400,
    );
  }

  try {
    const result = await searchNearbyPlaces(parsed.data);
    return jsonResponse(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to search places';
    if (message.includes('APIFY_TOKEN')) return jsonResponse({ error: message }, 500);
    return jsonResponse({ error: message }, 502);
  }
}
