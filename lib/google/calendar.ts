import {
  getGoogleOAuthClientId,
  getGoogleOAuthClientSecret,
} from '@/constants/env';
import {
  getGoogleTokens,
  upsertGoogleTokens,
  type GoogleTokenRow,
} from '@/lib/supabase/google';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

export interface CalendarEvent {
  id: string;
  summary: string | null;
  start: string | null;
  end: string | null;
  location: string | null;
  description: string | null;
  htmlLink: string | null;
}

interface GoogleEventResource {
  id?: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
  description?: string;
  htmlLink?: string;
}

interface RefreshResponse {
  access_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
}

interface ExchangeResponse extends RefreshResponse {
  refresh_token?: string;
}

function nowMs() {
  return Date.now();
}

async function refreshAccessToken(
  userId: string,
  current: GoogleTokenRow,
): Promise<string> {
  if (!current.refresh_token) {
    throw new Error('No refresh token stored — user must reconnect Google Calendar.');
  }
  const body = new URLSearchParams({
    client_id: getGoogleOAuthClientId(),
    client_secret: getGoogleOAuthClientSecret(),
    refresh_token: current.refresh_token,
    grant_type: 'refresh_token',
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    throw new Error(`Google token refresh failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as RefreshResponse;
  if (!data.access_token) throw new Error('Google refresh returned no access_token');
  const expiresIn = data.expires_in ?? 3600;
  const expiry = new Date(nowMs() + expiresIn * 1000).toISOString();
  await upsertGoogleTokens(userId, {
    access_token: data.access_token,
    expiry,
    scope: data.scope ?? current.scope,
  });
  return data.access_token;
}

async function getValidAccessToken(userId: string): Promise<string> {
  const current = await getGoogleTokens(userId);
  if (!current) throw new Error('No Google tokens stored for user');

  const expiryMs = current.expiry ? Date.parse(current.expiry) : 0;
  const stillValid = current.access_token && expiryMs - nowMs() > 60_000;
  if (stillValid && current.access_token) return current.access_token;
  return refreshAccessToken(userId, current);
}

export async function exchangeAuthCode(args: {
  userId: string;
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<void> {
  const body = new URLSearchParams({
    client_id: getGoogleOAuthClientId(),
    client_secret: getGoogleOAuthClientSecret(),
    code: args.code,
    code_verifier: args.codeVerifier,
    redirect_uri: args.redirectUri,
    grant_type: 'authorization_code',
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    throw new Error(`Google code exchange failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as ExchangeResponse;
  if (!data.access_token) throw new Error('Google exchange returned no access_token');
  const expiresIn = data.expires_in ?? 3600;
  await upsertGoogleTokens(args.userId, {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? null,
    expiry: new Date(nowMs() + expiresIn * 1000).toISOString(),
    scope: data.scope ?? null,
  });
}

function normalizeEvent(raw: GoogleEventResource): CalendarEvent {
  return {
    id: raw.id ?? '',
    summary: raw.summary ?? null,
    start: raw.start?.dateTime ?? raw.start?.date ?? null,
    end: raw.end?.dateTime ?? raw.end?.date ?? null,
    location: raw.location ?? null,
    description: raw.description ?? null,
    htmlLink: raw.htmlLink ?? null,
  };
}

export async function listUpcomingEvents(
  userId: string,
  hoursAhead = 24,
  maxResults = 10,
): Promise<CalendarEvent[]> {
  const accessToken = await getValidAccessToken(userId);
  const timeMin = new Date().toISOString();
  const timeMax = new Date(nowMs() + hoursAhead * 3_600_000).toISOString();

  const url = new URL(EVENTS_URL);
  url.searchParams.set('timeMin', timeMin);
  url.searchParams.set('timeMax', timeMax);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', String(maxResults));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Google Calendar events failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { items?: GoogleEventResource[] };
  return (data.items ?? []).map(normalizeEvent);
}
