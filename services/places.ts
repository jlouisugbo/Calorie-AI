import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { ENV } from '@/constants/env';
import type {
  FetchNearbyPlacesInput,
  FetchNearbyPlacesResponse,
} from '@/types/places';

const API_PATH = '/api/nearby-places';

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
    const host = hostUri.split('/')[0];
    return `http://${host}`;
  }

  return '';
}

export async function fetchNearbyPlaces(
  input: FetchNearbyPlacesInput,
): Promise<FetchNearbyPlacesResponse> {
  const { signal, ...body } = input;
  const baseUrl = resolveBaseUrl();
  const url = `${baseUrl}${API_PATH}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err;
    throw new Error(
      `Failed to reach nearby-places API${baseUrl ? ` at ${baseUrl}` : ''}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // fall through — non-JSON body handled below
  }

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && 'error' in data && typeof (data as { error?: unknown }).error === 'string'
        ? (data as { error: string }).error
        : null) ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (!data || typeof data !== 'object' || !Array.isArray((data as { places?: unknown }).places)) {
    throw new Error('Unexpected response shape from nearby-places API');
  }

  return data as FetchNearbyPlacesResponse;
}
