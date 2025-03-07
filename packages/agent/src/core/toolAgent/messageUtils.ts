import { Message } from '../llm/types.js';

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
