import { getAnthropicApiKey } from '@/constants/env';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

export const DEFAULT_MODEL = 'claude-sonnet-4-6';
export const DEFAULT_MAX_TOKENS = 1024;

export type ToolUseBlock = {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
};

export type TextBlock = {
  type: 'text';
  text: string;
};

export type ContentBlock = TextBlock | ToolUseBlock;

export type ToolResultBlock = {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
};

export type AnthropicTextMessage = {
  role: 'user' | 'assistant';
  content: string | Array<TextBlock | ToolResultBlock | ToolUseBlock>;
};

export interface AnthropicToolDef {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface AnthropicMessageResponse {
  id: string;
  role: 'assistant';
  content: ContentBlock[];
  stop_reason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence' | string;
  usage?: { input_tokens: number; output_tokens: number };
}

export interface CallAnthropicArgs {
  messages: AnthropicTextMessage[];
  system?: string;
  tools?: AnthropicToolDef[];
  toolChoice?: { type: 'auto' } | { type: 'any' } | { type: 'tool'; name: string };
  model?: string;
  maxTokens?: number;
}

export async function callAnthropic(
  args: CallAnthropicArgs,
): Promise<AnthropicMessageResponse> {
  const body: Record<string, unknown> = {
    model: args.model ?? DEFAULT_MODEL,
    max_tokens: args.maxTokens ?? DEFAULT_MAX_TOKENS,
    messages: args.messages,
  };
  if (args.system) body.system = args.system;
  if (args.tools && args.tools.length > 0) body.tools = args.tools;
  if (args.toolChoice) body.tool_choice = args.toolChoice;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': getAnthropicApiKey(),
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API ${response.status}: ${text}`);
  }

  return (await response.json()) as AnthropicMessageResponse;
}
