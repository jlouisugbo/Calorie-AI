import { z } from 'zod';
import { getOpenAIApiKey } from '@/constants/env';
import { buildAgentContext, buildSystemPrompt } from '@/lib/agent/context';
import { TOOL_DEFS } from '@/lib/agent/tools';

const REALTIME_SESSIONS_URL = 'https://api.openai.com/v1/realtime/sessions';
const REALTIME_MODEL = 'gpt-4o-realtime-preview';
const VOICE = 'alloy';

const inputSchema = z.object({
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
 * Mints an ephemeral OpenAI Realtime session preloaded with the user's
 * agent context and tool definitions. The mobile client uses the returned
 * `client_secret` to open a WebSocket / WebRTC connection directly to
 * OpenAI; tool function-calls are routed back through /api/voice-tool.
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
  const { userId, coords } = parsed.data;
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
  const instructions = `${buildSystemPrompt(ctx)}

You are speaking aloud. Keep replies short (1–3 sentences). When the user mentions a place ("I'm in LAX"), call search_nearby_places. When they ask about their day, call get_calendar_events. Always personalize using get_user_profile / get_biomarkers.`;

  const realtimeTools = TOOL_DEFS.map((t) => ({
    type: 'function' as const,
    name: t.name,
    description: t.description,
    parameters: t.input_schema,
  }));

  let res: Response;
  try {
    res = await fetch(REALTIME_SESSIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getOpenAIApiKey()}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime=v1',
      },
      body: JSON.stringify({
        model: REALTIME_MODEL,
        voice: VOICE,
        modalities: ['audio', 'text'],
        instructions,
        tools: realtimeTools,
        tool_choice: 'auto',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: { model: 'whisper-1' },
      }),
    });
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'OpenAI fetch failed' },
      502,
    );
  }

  if (!res.ok) {
    return jsonResponse(
      {
        error: `OpenAI Realtime session create failed (${res.status})`,
        detail: await res.text(),
      },
      502,
    );
  }
  const data = await res.json();
  return jsonResponse({
    session: data,
    contextSummary: {
      hasProfile: !!ctx.profile,
      hasCoords: !!ctx.coords,
      biomarkerCount: ctx.biomarkers.length,
    },
  });
}
