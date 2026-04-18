import { z } from 'zod';
import { getOpenAIApiKey } from '@/constants/env';

const SPEECH_URL = 'https://api.openai.com/v1/audio/speech';
const MODEL = 'gpt-4o-mini-tts';
const VOICE = 'alloy';

const inputSchema = z.object({
  text: z.string().min(1).max(4000),
  voice: z.string().optional(),
  format: z.enum(['mp3', 'wav', 'aac']).optional(),
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Returns synthesized speech. Default response is base64-encoded mp3 in JSON
 * so the React Native client can write it to a file via expo-file-system and
 * play it through expo-av without needing native streaming.
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
  const format = parsed.data.format ?? 'mp3';
  const res = await fetch(SPEECH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getOpenAIApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      voice: parsed.data.voice ?? VOICE,
      input: parsed.data.text,
      response_format: format,
    }),
  });
  if (!res.ok) {
    return jsonResponse(
      { error: `TTS failed (${res.status})`, detail: await res.text() },
      502,
    );
  }
  const buf = await res.arrayBuffer();
  const base64 = Buffer.from(buf).toString('base64');
  return jsonResponse({ audioBase64: base64, format });
}
