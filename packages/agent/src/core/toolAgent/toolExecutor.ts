import { executeToolCall } from '../executeToolCall.js';
import { Message } from '../llm/types.js';
import { TokenTracker } from '../tokens.js';
import { Tool, ToolCall, ToolContext } from '../types.js';

import { addToolResultToMessages } from './messageUtils.js';
import { ToolCallResult } from './types.js';

const safeParse = (value: string, context: Record<string, string>) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error(
      'Error parsing JSON:',
      error,
      'original value:',
      value,
      'context',
      JSON.stringify(context),
    );
    return { error: value };
  }
};

/**
 * Executes a list of tool calls and returns the results
 */
export async function executeTools(
  toolCalls: ToolCall[],
  tools: Tool[],
  messages: Message[],
  context: ToolContext,
): Promise<ToolCallResult> {
  if (toolCalls.length === 0) {
    return { agentDoned: false, toolResults: [] };
  }

  const { logger } = context;

  logger.info(`Executing ${toolCalls.length} tool calls`);

  const toolResults = await Promise.all(
    toolCalls.map(async (call) => {
      let toolResult = '';
      let isError = false;
      try {
        toolResult = await executeToolCall(call, tools, {
          ...context,
          tokenTracker: new TokenTracker(call.name, context.tokenTracker),
        });
      } catch (errorStr: any) {
        isError = true;
        if (errorStr instanceof Error) {
          if (errorStr.stack) {
            context.logger.error(`Tool error stack trace: ${errorStr.stack}`);
          }
          toolResult = JSON.stringify(errorStr);
        } else {
          toolResult = JSON.stringify({
            errorMessage: errorStr.message,
            errorType: errorStr.name,
          });
        }
      }

      const parsedResult = safeParse(toolResult, { tool: call.name });

      // Add the tool result to messages
      addToolResultToMessages(messages, call.id, parsedResult, isError);

      return {
        toolCallId: call.id,
        toolName: call.name,
        result: parsedResult,
      };
    }),
  );

  const agentDonedTool = toolResults.find((r) => r.toolName === 'agentDone');
  const completionResult = agentDonedTool
    ? (agentDonedTool.result as { result: string }).result
    : undefined;

  if (agentDonedTool) {
    logger.debug('Sequence completed', { completionResult });
  }

  return {
    agentDoned: agentDonedTool !== undefined,
    completionResult,
    toolResults,
  };
}
