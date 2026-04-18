import { getOpenAIApiKey } from '@/constants/env';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

export const DEFAULT_MODEL = 'gpt-4.1';
export const DEFAULT_MAX_OUTPUT_TOKENS = 1024;

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

export type ToolResultBlock = {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
};

export type AgentTextMessage = {
  role: 'user' | 'assistant';
  content: string | Array<TextBlock | ToolResultBlock | ToolUseBlock>;
};

export interface AgentToolDef {
  type: 'function';
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  strict?: boolean;
}

export interface OpenAIOutputTextContent {
  type: 'output_text';
  text: string;
}

export interface OpenAIMessageItem {
  type: 'message';
  role: 'assistant';
  content: OpenAIOutputTextContent[];
}

export interface OpenAIFunctionCallItem {
  type: 'function_call';
  id?: string;
  call_id: string;
  name: string;
  arguments: string;
}

export interface OpenAIFunctionCallOutputItem {
  type: 'function_call_output';
  call_id: string;
  output: string;
}

export interface OpenAIReasoningItem {
  type: 'reasoning';
  [key: string]: unknown;
}

export type OpenAIOutputItem =
  | OpenAIMessageItem
  | OpenAIFunctionCallItem
  | OpenAIReasoningItem;

export type OpenAIInputItem =
  | { role: 'user' | 'assistant'; content: string }
  | OpenAIOutputItem
  | OpenAIFunctionCallOutputItem;

export interface OpenAIResponse {
  id: string;
  status: string;
  output: OpenAIOutputItem[];
}

export interface CallOpenAIArgs {
  input: OpenAIInputItem[];
  instructions?: string;
  tools?: AgentToolDef[];
  toolChoice?: 'auto' | 'required' | { type: 'function'; name: string };
  model?: string;
  maxTokens?: number;
}

export async function callOpenAI(
  args: CallOpenAIArgs,
): Promise<OpenAIResponse> {
  const body: Record<string, unknown> = {
    model: args.model ?? DEFAULT_MODEL,
    input: args.input,
    max_output_tokens: args.maxTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
  };

  if (args.instructions) body.instructions = args.instructions;
  if (args.tools && args.tools.length > 0) body.tools = args.tools;
  if (args.toolChoice) body.tool_choice = args.toolChoice;

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getOpenAIApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('OpenAI Responses API failed', {
      status: response.status,
      body: text,
    });
    throw new Error(`OpenAI request failed (${response.status})`);
  }

  const data = (await response.json()) as Partial<OpenAIResponse>;
  if (!data || typeof data.id !== 'string' || !Array.isArray(data.output)) {
    throw new Error('OpenAI response had an unexpected shape');
  }

  return data as OpenAIResponse;
}

export function isFunctionCallItem(
  item: OpenAIOutputItem,
): item is OpenAIFunctionCallItem {
  return item.type === 'function_call';
}

export function parseFunctionArguments(
  input: string,
): Record<string, unknown> {
  try {
    const parsed = JSON.parse(input);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    console.warn('Failed to parse OpenAI function arguments', input);
  }

  return {};
}
