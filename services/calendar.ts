import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { ENV } from '@/constants/env';

export interface CalendarEvent {
  id: string;
  summary: string | null;
  start: string | null;
  end: string | null;
  location: string | null;
  description: string | null;
  htmlLink: string | null;
}

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

export async function exchangeGoogleAuthCode(args: {
  userId: string;
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<void> {
  const url = `${resolveBaseUrl()}/api/google/exchange`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google exchange failed (${res.status}): ${text}`);
  }
}

export async function fetchUpcomingEvents(args: {
  userId: string;
  hoursAhead?: number;
  maxResults?: number;
}): Promise<CalendarEvent[]> {
  const url = `${resolveBaseUrl()}/api/calendar/events`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  const data = (await res.json()) as { events?: CalendarEvent[]; error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `Calendar request failed (${res.status})`);
  }
  return data.events ?? [];
}
