import {
  callAnthropic,
  type AnthropicMessageResponse,
  type AnthropicTextMessage,
  type AnthropicToolDef,
  type ToolUseBlock,
} from './anthropic';
import type { AgentContext } from './context';
import { runTool, TOOL_DEFS } from './tools';

const MAX_ITERATIONS = 6;

export interface AgentTrace {
  iterations: number;
  toolCalls: Array<{
    name: string;
    input: Record<string, unknown>;
    isError: boolean;
    resultPreview: string;
  }>;
  stopReason: string;
}

export interface RunAgentArgs {
  messages: AnthropicTextMessage[];
  system: string;
  ctx: AgentContext;
  tools?: AnthropicToolDef[];
  toolChoice?:
    | { type: 'auto' }
    | { type: 'any' }
    | { type: 'tool'; name: string };
  maxTokens?: number;
}

export interface RunAgentResult {
  text: string;
  trace: AgentTrace;
  finalResponse: AnthropicMessageResponse;
  /** All assistant + tool_result turns appended during this run. */
  appendedMessages: AnthropicTextMessage[];
}

function extractText(response: AnthropicMessageResponse): string {
  const parts: string[] = [];
  for (const block of response.content) {
    if (block.type === 'text') parts.push(block.text);
  }
  return parts.join('\n').trim();
}

function previewResult(result: unknown): string {
  try {
    const json = JSON.stringify(result);
    return json.length > 280 ? `${json.slice(0, 280)}…` : json;
  } catch {
    return String(result);
  }
}

export async function runAgent(args: RunAgentArgs): Promise<RunAgentResult> {
  const messages: AnthropicTextMessage[] = [...args.messages];
  const appended: AnthropicTextMessage[] = [];
  const tools = args.tools ?? TOOL_DEFS;
  const trace: AgentTrace = {
    iterations: 0,
    toolCalls: [],
    stopReason: 'unknown',
  };

  let response: AnthropicMessageResponse | null = null;

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    trace.iterations = iter + 1;
    response = await callAnthropic({
      messages,
      system: args.system,
      tools,
      toolChoice: args.toolChoice,
      maxTokens: args.maxTokens,
    });

    trace.stopReason = response.stop_reason;

    if (response.stop_reason !== 'tool_use') {
      const assistantMessage: AnthropicTextMessage = {
        role: 'assistant',
        content: response.content,
      };
      messages.push(assistantMessage);
      appended.push(assistantMessage);
      break;
    }

    const assistantMessage: AnthropicTextMessage = {
      role: 'assistant',
      content: response.content,
    };
    messages.push(assistantMessage);
    appended.push(assistantMessage);

    const toolUses = response.content.filter(
      (b): b is ToolUseBlock => b.type === 'tool_use',
    );

    const toolResults: AnthropicTextMessage['content'] = [];
    for (const tu of toolUses) {
      const { result, isError } = await runTool(tu.name, tu.input, args.ctx);
      const preview = previewResult(result);
      trace.toolCalls.push({
        name: tu.name,
        input: tu.input,
        isError,
        resultPreview: preview,
      });
      toolResults.push({
        type: 'tool_result',
        tool_use_id: tu.id,
        content: typeof result === 'string' ? result : JSON.stringify(result),
        is_error: isError || undefined,
      });
    }

    const userMessage: AnthropicTextMessage = {
      role: 'user',
      content: toolResults,
    };
    messages.push(userMessage);
    appended.push(userMessage);
  }

  if (!response) {
    throw new Error('Agent loop produced no response');
  }

  return {
    text: extractText(response),
    trace,
    finalResponse: response,
    appendedMessages: appended,
  };
}
