import {
  callOpenAI,
  isFunctionCallItem,
  parseFunctionArguments,
  type AgentToolDef,
  type AgentTextMessage,
  type OpenAIInputItem,
  type OpenAIResponse,
  type ToolUseBlock,
} from './openai';
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
  messages: AgentTextMessage[];
  system: string;
  ctx: AgentContext;
  tools?: AgentToolDef[];
  toolChoice?: 'auto' | 'required' | { type: 'function'; name: string };
  maxTokens?: number;
}

export interface RunAgentResult {
  text: string;
  trace: AgentTrace;
  finalResponse: OpenAIResponse;
  /** All assistant + tool_result turns appended during this run. */
  appendedMessages: AgentTextMessage[];
}

function extractText(response: OpenAIResponse): string {
  const parts: string[] = [];
  for (const block of response.output) {
    if (block.type !== 'message') continue;
    for (const item of block.content) {
      if (item.type === 'output_text') parts.push(item.text);
    }
  }
  return parts.join('\n').trim();
}

function toInputMessages(messages: AgentTextMessage[]): OpenAIInputItem[] {
  return messages.map((message) => {
    if (typeof message.content === 'string') {
      return {
        role: message.role,
        content: message.content,
      };
    }

    const textBlocks = message.content.filter(
      (block): block is { type: 'text'; text: string } => block.type === 'text',
    );

    if (textBlocks.length !== message.content.length) {
      throw new Error('runAgent only accepts plain text conversation history.');
    }

    return {
      role: message.role,
      content: textBlocks.map((block) => block.text).join('\n').trim(),
    };
  });
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
  const appended: AgentTextMessage[] = [];
  const tools = args.tools ?? TOOL_DEFS;
  const input: OpenAIInputItem[] = toInputMessages(args.messages);
  const trace: AgentTrace = {
    iterations: 0,
    toolCalls: [],
    stopReason: 'unknown',
  };

  let response: OpenAIResponse | null = null;

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    trace.iterations = iter + 1;
    response = await callOpenAI({
      input,
      instructions: args.system,
      tools,
      toolChoice: iter === 0 ? args.toolChoice : 'auto',
      maxTokens: args.maxTokens,
    });

    const text = extractText(response);
    const toolUses = response.output.filter(isFunctionCallItem);
    trace.stopReason = toolUses.length > 0 ? 'tool_use' : response.status;

    if (toolUses.length === 0) {
      const assistantMessage: AgentTextMessage = {
        role: 'assistant',
        content: text,
      };
      appended.push(assistantMessage);
      break;
    }

    const assistantBlocks: Array<
      { type: 'text'; text: string } | ToolUseBlock
    > = [];
    if (text) assistantBlocks.push({ type: 'text', text });

    const assistantMessage: AgentTextMessage = {
      role: 'assistant',
      content: assistantBlocks,
    };
    input.push(...response.output);

    for (const tu of toolUses) {
      const toolInput = parseFunctionArguments(tu.arguments);
      assistantBlocks.push({
        type: 'tool_use',
        id: tu.call_id,
        name: tu.name,
        input: toolInput,
      });

      const { result, isError } = await runTool(tu.name, toolInput, args.ctx);
      const preview = previewResult(result);
      trace.toolCalls.push({
        name: tu.name,
        input: toolInput,
        isError,
        resultPreview: preview,
      });
      input.push({
        type: 'function_call_output',
        call_id: tu.call_id,
        output: typeof result === 'string' ? result : JSON.stringify(result),
      });
    }

    appended.push(assistantMessage);
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
