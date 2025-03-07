// Define our own message types to replace Vercel AI SDK types
export interface MessageContent {
  type: string;
  text?: string;
  toolName?: string;
  toolCallId?: string;
  args?: any;
  result?: any;
}

export interface CoreMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | MessageContent[];
}

export interface ToolCallPart {
  type: 'tool-call';
  toolCallId: string;
  toolName: string;
  args: any;
}

/**
 * Creates a message for llm-interface with caching enabled
 * This function will be enhanced in Phase 3 to support token caching with llm-interface
 */
export function createCacheControlMessageFromSystemPrompt(
  systemPrompt: string,
): CoreMessage {
  return {
    role: 'system',
    content: systemPrompt,
  };
}

/**
 * Adds cache control to the messages
 * This function will be enhanced in Phase 3 to support token caching with llm-interface
 */
export function addCacheControlToMessages(
  messages: CoreMessage[],
): CoreMessage[] {
  return messages;
}

/**
 * Formats tool calls from the AI into the ToolUseContent format
 */
export function formatToolCalls(toolCalls: any[]): any[] {
  return toolCalls.map((call) => ({
    type: 'tool_use',
    name: call.name,
    id: call.id,
    input: call.input,
  }));
}

/**
 * Creates tool call parts for the assistant message
 */
export function createToolCallParts(toolCalls: any[]): Array<ToolCallPart> {
  return toolCalls.map((toolCall) => ({
    type: 'tool-call',
    toolCallId: toolCall.id,
    toolName: toolCall.name,
    args: toolCall.input,
  }));
}

/**
 * Converts CoreMessage format to llm-interface message format
 */
export function convertToLLMInterfaceMessages(messages: CoreMessage[]): any[] {
  return messages.map((message) => {
    if (typeof message.content === 'string') {
      return {
        role: message.role,
        content: message.content,
      };
    } else {
      // Handle complex content (text or tool calls)
      if (
        message.role === 'assistant' &&
        message.content.some((c) => c.type === 'tool-call')
      ) {
        // This is a message with tool calls
        return {
          role: message.role,
          content: message.content
            .filter((c) => c.type === 'text')
            .map((c) => c.text || '')
            .join(''),
          tool_calls: message.content
            .filter((c) => c.type === 'tool-call')
            .map((c) => ({
              id: c.toolCallId || '',
              type: 'function',
              function: {
                name: c.toolName || '',
                arguments: JSON.stringify(c.args || {}),
              },
            })),
        };
      } else if (message.role === 'tool') {
        // This is a tool response message
        const content = message.content[0];
        return {
          role: 'tool',
          tool_call_id: content?.toolCallId || '',
          content: content?.result ? JSON.stringify(content.result) : '{}',
        };
      } else {
        // Regular user or assistant message with text content
        return {
          role: message.role,
          content: message.content.map((c) => c.text || '').join(''),
        };
      }
    }
  });
}
