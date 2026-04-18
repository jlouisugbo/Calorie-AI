import { getOpenAIApiKey } from '@/constants/env';

const TRANSCRIPTIONS_URL = 'https://api.openai.com/v1/audio/transcriptions';
const MODEL = 'whisper-1';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Accepts multipart form-data with a single `audio` file (m4a/wav/mp3/webm).
 * Returns `{ text }`. Used by the voice tab's record-then-send fallback so we
 * don't need raw PCM streaming to make voice work in Expo Go.
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonResponse({ error: 'Expected multipart/form-data' }, 400);
  }
  const file = form.get('audio');
  if (!(file instanceof File) && typeof (file as Blob | null)?.arrayBuffer !== 'function') {
    return jsonResponse({ error: "Missing 'audio' file part" }, 400);
  }

  const upstream = new FormData();
  upstream.append('file', file as Blob, 'audio.m4a');
  upstream.append('model', MODEL);

  const res = await fetch(TRANSCRIPTIONS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getOpenAIApiKey()}` },
    body: upstream,
  });
  if (!res.ok) {
    return jsonResponse(
      { error: `Whisper failed (${res.status})`, detail: await res.text() },
      502,
    );
  }
  const data = (await res.json()) as { text?: string };
  return jsonResponse({ text: data.text ?? '' });
}
