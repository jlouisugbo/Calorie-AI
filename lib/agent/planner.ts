import { runAgent } from './runner';
import { TOOL_DEFS } from './tools';
import { buildAgentContext, buildSystemPrompt, type AgentContext } from './context';
import type { AnthropicToolDef } from './anthropic';

export interface ProposedNotification {
  skip: boolean;
  trigger: string;
  title: string;
  body: string;
  deeplink?: string;
}

const PROPOSE_TOOL: AnthropicToolDef = {
  name: 'propose_notification',
  description:
    'Decide whether to push a proactive notification right now. Use skip=true when there is no clear, time-sensitive value within the next 30 minutes.',
  input_schema: {
    type: 'object',
    properties: {
      skip: {
        type: 'boolean',
        description: 'Pass true to suppress the notification this tick.',
      },
      trigger: {
        type: 'string',
        description:
          "Short slug describing why we are notifying, e.g. 'pre_meeting_meal', 'low_glucose', 'workout_recovery'. Required when skip=false.",
      },
      title: {
        type: 'string',
        maxLength: 60,
      },
      body: {
        type: 'string',
        maxLength: 240,
      },
      deeplink: {
        type: 'string',
        description: "Optional in-app route, e.g. '/(tabs)/voice' or '/(tabs)/nearby'.",
      },
    },
    required: ['skip'],
    additionalProperties: false,
  },
};

const PLANNER_SYSTEM_SUFFIX = `

You are the proactive coach loop. Every 15 minutes you receive a fresh snapshot
(profile, calendar, biomarkers, location). Decide whether to send the user a
single short push notification.

Use the read tools (get_calendar_events, get_biomarkers, search_nearby_places,
get_location, get_user_profile) to gather what you need. Then call the
propose_notification tool exactly once. Skip aggressively — only notify when
the next 30 minutes have a concrete, time-sensitive nudge (e.g. "your 1pm is
in 25min and you haven't eaten — try X near you", "glucose trending low —
grab a snack before your run").
`;

export async function planNotification(args: {
  userId: string;
  ctx?: AgentContext;
}): Promise<{ proposal: ProposedNotification; trace: unknown }> {
  const ctx = args.ctx ?? (await buildAgentContext({ userId: args.userId }));
  const system = buildSystemPrompt(ctx) + PLANNER_SYSTEM_SUFFIX;
  const tools = [...TOOL_DEFS, PROPOSE_TOOL];

  const result = await runAgent({
    messages: [
      {
        role: 'user',
        content:
          'Tick: decide if a proactive nudge is warranted right now. Call propose_notification when ready.',
      },
    ],
    system,
    ctx,
    tools,
    maxTokens: 1024,
  });

  const proposal = extractProposal(result.appendedMessages);
  return { proposal, trace: result.trace };
}

interface AssistantContentBlock {
  type: string;
  name?: string;
  input?: Record<string, unknown>;
}

function extractProposal(
  messages: { role: string; content: unknown }[],
): ProposedNotification {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== 'assistant' || !Array.isArray(msg.content)) continue;
    for (const block of msg.content as AssistantContentBlock[]) {
      if (block.type === 'tool_use' && block.name === 'propose_notification') {
        const input = (block.input ?? {}) as Partial<ProposedNotification>;
        return {
          skip: !!input.skip,
          trigger: input.trigger ?? 'unspecified',
          title: input.title ?? 'Calorie-AI',
          body: input.body ?? '',
          deeplink: input.deeplink,
        };
      }
    }
  }
  return { skip: true, trigger: 'no_decision', title: '', body: '' };
}
