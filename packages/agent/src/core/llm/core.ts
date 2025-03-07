/**
 * Core LLM abstraction for generating text
 */

import { LLMProvider } from './provider.js';
import {
  AssistantMessage,
  FunctionDefinition,
  GenerateOptions,
  LLMResponse,
  Message,
  SystemMessage,
  ToolResultMessage,
  ToolUseMessage,
  UserMessage,
} from './types.js';

/**
 * Generate text using the specified LLM provider
 *
 * @param provider The LLM provider implementation
 * @param options Options for generation including messages, functions, etc.
 * @returns A response containing generated text and/or tool calls
 */
export async function generateText(
  provider: LLMProvider,
  options: GenerateOptions,
): Promise<LLMResponse> {
  // Validate options
  if (!options.messages || options.messages.length === 0) {
    throw new Error('Messages array cannot be empty');
  }

  // Use the provider to generate the response
  return provider.generateText(options);
}

/**
 * Format function definitions for provider compatibility
 *
 * @param functions Function definitions
 * @returns Normalized function definitions
 */
export function normalizeFunctionDefinitions(
  functions?: FunctionDefinition[],
): FunctionDefinition[] {
  if (!functions || functions.length === 0) {
    return [];
  }

  return functions.map((fn) => ({
    name: fn.name,
    description: fn.description,
    parameters: fn.parameters,
  }));
}

/**
 * Convert messages to provider-specific format if needed
 *
 * @param messages Array of messages
 * @returns Normalized messages
 */
export function normalizeMessages(messages: Message[]): Message[] {
  return messages.map((msg: any) => {
    // Ensure content is a string
    if (typeof msg.content !== 'string') {
      throw new Error(
        `Message content must be a string: ${JSON.stringify(msg)}`,
      );
    }

    // Handle each role type explicitly
    switch (msg.role) {
      case 'system':
        return {
          role: 'system',
          content: msg.content,
        } satisfies SystemMessage;
      case 'user':
        return {
          role: 'user',
          content: msg.content,
        } satisfies UserMessage;
      case 'assistant':
        return {
          role: 'assistant',
          content: msg.content,
        } satisfies AssistantMessage;
      case 'tool_use':
        return {
          role: 'tool_use',
          id: msg.id,
          name: msg.name,
          content: msg.content,
        } satisfies ToolUseMessage;
      case 'tool_result':
        return {
          role: 'tool_result',
          tool_use_id: msg.tool_use_id,
          content: msg.content,
          is_error: msg.is_error,
        } satisfies ToolResultMessage;
      default:
        // Use type assertion for unknown roles
        console.warn(
          `Unexpected message role: ${String(msg.role)}, treating as user message`,
        );
        return {
          role: 'user',
          content: msg.content,
        };
    }
  });
}
