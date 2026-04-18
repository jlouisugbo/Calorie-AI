import { z } from 'zod';
import { buildAgentContext, buildSystemPrompt } from '@/lib/agent/context';
import { runAgent } from '@/lib/agent/runner';
import type { AgentTextMessage } from '@/lib/agent/openai';
import { setUserState } from '@/lib/supabase/notifications';

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000),
});

const inputSchema = z.object({
  messages: z.array(messageSchema).min(1).max(50),
  userId: z.string().uuid().optional().nullable(),
  coords: z
    .object({
      latitude: z.number().gte(-90).lte(90),
      longitude: z.number().gte(-180).lte(180),
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

  const { messages, userId, coords } = parsed.data;

  const ctx = await buildAgentContext({
    userId: userId ?? null,
    coords: coords
      ? {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy ?? null,
          timestamp: coords.timestamp ?? undefined,
        }
      : null,
  });

  if (userId && coords) {
    try {
      await setUserState(userId, {
        last_lat: coords.latitude,
        last_lng: coords.longitude,
        last_seen: new Date().toISOString(),
      });
    } catch {
      // user_state is best-effort; do not block the agent run.
    }
  }

  const system = buildSystemPrompt(ctx);
  const agentMessages: AgentTextMessage[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    const result = await runAgent({
      messages: agentMessages,
      system,
      ctx,
    });
    return jsonResponse({
      text: result.text,
      trace: {
        ...result.trace,
        toolCalls: result.trace.toolCalls.map((call) => ({
          name: call.name,
          isError: call.isError,
        })),
      },
    });
  } catch (err) {
    console.error('Agent run failed', err);
    return jsonResponse({ error: 'Chat request failed' }, 502);
  }
}
