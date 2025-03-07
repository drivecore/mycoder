import { Message, ToolCall } from '../llm/types.js';

/**
 * Formats tool calls from the LLM into the ToolUseContent format
 */
export function formatToolCalls(toolCalls: ToolCall[]): any[] {
  return toolCalls.map((call) => ({
    type: 'tool_use',
    name: call.name,
    id: call.id,
    input: call.arguments,
  }));
}

/**
 * Creates tool call parts for the assistant message
 * This is for backward compatibility with existing code
 */
export function createToolCallParts(toolCalls: any[]): any[] {
  return toolCalls.map((toolCall) => ({
    type: 'tool-call',
    toolCallId: toolCall.id,
    toolName: toolCall.name,
    args: toolCall.arguments,
  }));
}

/**
 * Helper function to add a tool result to messages
 */
export function addToolResultToMessages(
  messages: Message[],
  toolUseId: string,
  toolResult: any,
  isError: boolean,
): void {
  messages.push({
    role: 'tool_result',
    tool_use_id: toolUseId,
    content:
      typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult),
    is_error: isError,
  });
}
