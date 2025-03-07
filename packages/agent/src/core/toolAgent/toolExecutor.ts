import { executeToolCall } from '../executeToolCall.js';
import { Message } from '../llm/types.js';
import { TokenTracker } from '../tokens.js';
import { ToolUseContent } from '../types.js';

import { addToolResultToMessages } from './messageUtils.js';
import { Tool, ToolCallResult, ToolContext } from './types.js';

const safeParse = (value: string) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error('Error parsing JSON:', error, 'original value:', value);
    return { error: value };
  }
};

/**
 * Executes a list of tool calls and returns the results
 */
export async function executeTools(
  toolCalls: ToolUseContent[],
  tools: Tool[],
  messages: Message[],
  context: ToolContext,
): Promise<ToolCallResult> {
  if (toolCalls.length === 0) {
    return { sequenceCompleted: false, toolResults: [] };
  }

  const { logger } = context;

  logger.verbose(`Executing ${toolCalls.length} tool calls`);

  // Check for respawn tool call
  const respawnCall = toolCalls.find((call) => call.name === 'respawn');
  if (respawnCall) {
    // Add the tool result to messages
    addToolResultToMessages(messages, respawnCall.name, { success: true });

    return {
      sequenceCompleted: false,
      toolResults: [
        {
          toolCallId: respawnCall.id,
          toolName: respawnCall.name,
          result: { success: true },
        },
      ],
      respawn: {
        context: respawnCall.input.respawnContext,
      },
    };
  }

  const toolResults = await Promise.all(
    toolCalls.map(async (call) => {
      let toolResult = '';
      try {
        toolResult = await executeToolCall(call, tools, {
          ...context,
          tokenTracker: new TokenTracker(call.name, context.tokenTracker),
        });
      } catch (errorStr: any) {
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

      const parsedResult = safeParse(toolResult);

      // Add the tool result to messages
      addToolResultToMessages(messages, call.name, parsedResult);

      return {
        toolCallId: call.id,
        toolName: call.name,
        result: parsedResult,
      };
    }),
  );

  const sequenceCompletedTool = toolResults.find(
    (r) => r.toolName === 'sequenceComplete',
  );
  const completionResult = sequenceCompletedTool
    ? (sequenceCompletedTool.result as { result: string }).result
    : undefined;

  if (sequenceCompletedTool) {
    logger.verbose('Sequence completed', { completionResult });
  }

  return {
    sequenceCompleted: sequenceCompletedTool !== undefined,
    completionResult,
    toolResults,
  };
}
