import { z } from 'zod';
import { buildAgentContext } from '@/lib/agent/context';
import { runTool } from '@/lib/agent/tools';

const inputSchema = z.object({
  tool: z.string(),
  input: z.record(z.unknown()).optional(),
  userId: z.string().uuid().optional().nullable(),
  coords: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      accuracy: z.number().nullable().optional(),
      timestamp: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Proxy that lets the OpenAI Realtime voice client invoke the same tool
 * registry that our text agent uses. Mobile receives `function_call` events
 * over the Realtime WebSocket, POSTs the function name + args here, and
 * forwards the response back into the Realtime conversation.
 */
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
  const coords = parsed.data.coords;
  const ctx = await buildAgentContext({
    userId: parsed.data.userId ?? null,
    coords: coords
      ? {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy ?? null,
          timestamp: coords.timestamp ?? undefined,
        }
      : null,
  });
  const { result, isError } = await runTool(
    parsed.data.tool,
    parsed.data.input ?? {},
    ctx,
  );
  return jsonResponse({ result, isError });
}
