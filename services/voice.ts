import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { ENV } from '@/constants/env';

function resolveBaseUrl(): string {
  if (ENV.API_BASE_URL) return ENV.API_BASE_URL.replace(/\/$/, '');
  if (Platform.OS === 'web') return '';
  const legacyManifest = (Constants as unknown as {
    manifest?: { debuggerHost?: string };
    manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
  });
  const hostUri =
    Constants.expoConfig?.hostUri ??
    legacyManifest.manifest?.debuggerHost ??
    legacyManifest.manifest2?.extra?.expoGo?.debuggerHost;
  if (typeof hostUri === 'string' && hostUri.length > 0) {
    return `http://${hostUri.split('/')[0]}`;
  }
  return '';
}

export async function transcribeAudio(args: {
  uri: string;
  mimeType?: string;
  filename?: string;
}): Promise<string> {
  const url = `${resolveBaseUrl()}/api/voice-stt`;
  const form = new FormData();
  form.append('audio', {
    uri: args.uri,
    name: args.filename ?? 'audio.m4a',
    type: args.mimeType ?? 'audio/m4a',
  } as unknown as Blob);

  const res = await fetch(url, {
    method: 'POST',
    body: form,
  });
  const data = (await res.json()) as { text?: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? `STT failed (${res.status})`);
  return data.text ?? '';
}

export interface SpeakResult {
  audioBase64: string;
  format: 'mp3' | 'wav' | 'aac';
}

export async function synthesizeSpeech(text: string): Promise<SpeakResult> {
  const url = `${resolveBaseUrl()}/api/voice-tts`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  const data = (await res.json()) as {
    audioBase64?: string;
    format?: 'mp3' | 'wav' | 'aac';
    error?: string;
  };
  if (!res.ok || !data.audioBase64) {
    throw new Error(data.error ?? `TTS failed (${res.status})`);
  }
  return { audioBase64: data.audioBase64, format: data.format ?? 'mp3' };
}

export interface RealtimeSessionInfo {
  session: {
    id?: string;
    client_secret?: { value: string; expires_at: number };
  };
  contextSummary: {
    hasProfile: boolean;
    hasCoords: boolean;
    biomarkerCount: number;
  };
}

export async function createRealtimeSession(args: {
  userId?: string | null;
  coords?: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    timestamp?: number | null;
  } | null;
}): Promise<RealtimeSessionInfo> {
  const url = `${resolveBaseUrl()}/api/voice-session`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? `Realtime session failed (${res.status})`);
  }
  return data as RealtimeSessionInfo;
}
