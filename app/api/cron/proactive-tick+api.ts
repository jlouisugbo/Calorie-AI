import { getCronSecret } from '@/constants/env';
import { listAllPushTokens } from '@/lib/supabase/push';
import { planNotification } from '@/lib/agent/planner';
import { sendExpoPush, type ExpoPushMessage } from '@/lib/notifications/expoPush';
import {
  logNotification,
  recentNotificationForTrigger,
} from '@/lib/supabase/notifications';

const COOLDOWN_MIN = 90;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

interface TickResult {
  userId: string;
  sent: boolean;
  trigger: string;
  reason?: string;
}

async function processUser(
  userId: string,
  tokens: string[],
): Promise<TickResult> {
  let proposal;
  try {
    const planned = await planNotification({ userId });
    proposal = planned.proposal;
  } catch (err) {
    return {
      userId,
      sent: false,
      trigger: 'planner_error',
      reason: err instanceof Error ? err.message : 'planner failed',
    };
  }
  if (proposal.skip) {
    return { userId, sent: false, trigger: proposal.trigger, reason: 'skipped' };
  }

  const dup = await recentNotificationForTrigger(
    userId,
    proposal.trigger,
    COOLDOWN_MIN,
  );
  if (dup) {
    return { userId, sent: false, trigger: proposal.trigger, reason: 'cooldown' };
  }

  const messages: ExpoPushMessage[] = tokens.map((to) => ({
    to,
    title: proposal.title,
    body: proposal.body,
    sound: 'default',
    data: {
      trigger: proposal.trigger,
      deeplink: proposal.deeplink,
    },
  }));

  await sendExpoPush(messages);
  await logNotification({
    userId,
    trigger: proposal.trigger,
    body: `${proposal.title}\n${proposal.body}`,
    agentTrace: { deeplink: proposal.deeplink },
  });
  return { userId, sent: true, trigger: proposal.trigger };
}

export async function POST(request: Request) {
  const required = getCronSecret();
  if (required) {
    const got = request.headers.get('x-cron-secret');
    if (got !== required) {
      return jsonResponse({ error: 'unauthorized' }, 401);
    }
  }

  let rows;
  try {
    rows = await listAllPushTokens();
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'token list failed' },
      500,
    );
  }

  const byUser = new Map<string, string[]>();
  for (const row of rows) {
    const list = byUser.get(row.user_id) ?? [];
    list.push(row.expo_token);
    byUser.set(row.user_id, list);
  }

  const results: TickResult[] = [];
  for (const [userId, tokens] of byUser.entries()) {
    try {
      results.push(await processUser(userId, tokens));
    } catch (err) {
      results.push({
        userId,
        sent: false,
        trigger: 'unhandled_error',
        reason: err instanceof Error ? err.message : 'unknown',
      });
    }
  }

  return jsonResponse({ count: results.length, results });
}
