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

export async function registerPushToken(args: {
  userId: string;
  expoToken: string;
  platform: string | null;
}): Promise<void> {
  const url = `${resolveBaseUrl()}/api/push/register`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    throw new Error(`Push register failed (${res.status}): ${await res.text()}`);
  }
}
