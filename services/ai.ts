import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { ENV } from '@/constants/env';
import type { AnthropicMessage } from '@/types';

const API_PATH = '/api/agent';

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

export interface AgentTurnInput {
  messages: AnthropicMessage[];
  userId?: string | null;
  coords?: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    timestamp?: number | null;
  } | null;
}

export interface AgentTurnResult {
  text: string;
  trace?: {
    iterations: number;
    toolCalls: {
      name: string;
      input: Record<string, unknown>;
      isError: boolean;
      resultPreview: string;
    }[];
    stopReason: string;
  };
}

export async function runAgentTurn(input: AgentTurnInput): Promise<AgentTurnResult> {
  const baseUrl = resolveBaseUrl();
  const url = `${baseUrl}${API_PATH}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }

  if (!response.ok) {
    const message =
      (data &&
      typeof data === 'object' &&
      'error' in data &&
      typeof (data as { error?: unknown }).error === 'string'
        ? (data as { error: string }).error
        : null) ?? `Agent request failed (${response.status})`;
    throw new Error(message);
  }

  if (!data || typeof data !== 'object' || typeof (data as { text?: unknown }).text !== 'string') {
    throw new Error('Unexpected response shape from agent API');
  }

  return data as AgentTurnResult;
}
