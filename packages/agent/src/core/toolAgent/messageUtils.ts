import { Message, ToolCall } from '../llm/types.js';

/**
 * Formats tool calls from the LLM into the ToolUseContent format
 */
export function formatToolCalls(toolCalls: ToolCall[]): any[] {
  return toolCalls.map((call) => ({
    type: 'tool_use',
    name: call.name,
    id: call.id,
    input: JSON.parse(call.arguments),
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
  toolName: string,
  toolResult: any
): void {
  messages.push({
    role: 'tool',
    name: toolName,
    content: typeof toolResult === 'string' 
      ? toolResult 
      : JSON.stringify(toolResult)
  });
}