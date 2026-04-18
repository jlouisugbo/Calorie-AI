import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { ENV } from '@/constants/env';
import {
  getLatestBiomarkersClient,
  type BiomarkerRow,
} from '@/lib/supabase/biomarkers-client';

function resolveBaseUrl(): string {
  if (ENV.API_BASE_URL) return ENV.API_BASE_URL.replace(/\/$/, '');
  if (Platform.OS === 'web') return '';

  const legacyManifest = Constants as unknown as {
    manifest?: { debuggerHost?: string };
    manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
  };
  const hostUri =
    Constants.expoConfig?.hostUri ??
    legacyManifest.manifest?.debuggerHost ??
    legacyManifest.manifest2?.extra?.expoGo?.debuggerHost;
  if (typeof hostUri === 'string' && hostUri.length > 0) {
    return `http://${hostUri.split('/')[0]}`;
  }
  return '';
}

export interface SeedSampleBiomarkersResult {
  inserted: number;
  latest: BiomarkerRow | null;
}

export async function seedSampleBiomarkers(
  userId: string,
  days = 7,
): Promise<SeedSampleBiomarkersResult> {
  const url = `${resolveBaseUrl()}/api/biomarkers/seed`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, days }),
  });
  const data = (await res.json()) as {
    inserted?: number;
    latest?: BiomarkerRow;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? `Seeding failed (${res.status})`);
  }
  return {
    inserted: data.inserted ?? 0,
    latest: data.latest ?? null,
  };
}

export async function fetchLatestBiomarkers(
  userId: string,
  limit = 7,
): Promise<BiomarkerRow[]> {
  return getLatestBiomarkersClient(userId, limit);
}

export type { BiomarkerRow };
