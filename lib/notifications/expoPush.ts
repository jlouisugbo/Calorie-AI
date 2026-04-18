const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface ExpoPushMessage {
  to: string;
  title?: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  channelId?: string;
}

export interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: Record<string, unknown>;
}

export async function sendExpoPush(
  messages: ExpoPushMessage[],
): Promise<ExpoPushTicket[]> {
  if (messages.length === 0) return [];
  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });
  if (!res.ok) {
    throw new Error(`Expo push failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { data?: ExpoPushTicket[] };
  return data.data ?? [];
}
