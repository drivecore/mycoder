/**
 * Core LLM abstraction for generating text
 */
import { FunctionDefinition, GenerateOptions, LLMResponse, Message, ToolCall } from './types.js';
import { LLMProvider } from './provider.js';

/**
 * Generate text using the specified LLM provider
 * 
 * @param provider The LLM provider implementation
 * @param options Options for generation including messages, functions, etc.
 * @returns A response containing generated text and/or tool calls
 */
export async function generateText(
  provider: LLMProvider,
  options: GenerateOptions
): Promise<LLMResponse> {
  // Validate options
  if (!options.messages || options.messages.length === 0) {
    throw new Error('Messages array cannot be empty');
  }

  // Use the provider to generate the response
  return provider.generateText(options);
}

/**
 * Format tool calls for consistent usage across providers
 * 
 * @param rawToolCalls Tool calls from provider
 * @returns Normalized tool calls
 */
export function normalizeToolCalls(rawToolCalls: any[]): ToolCall[] {
  if (!rawToolCalls || !Array.isArray(rawToolCalls) || rawToolCalls.length === 0) {
    return [];
  }

  return rawToolCalls.map((call) => {
    // Handle different provider formats
    if (typeof call.arguments === 'string') {
      // Already in correct format
      return {
        id: call.id || `tool-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        name: call.name || call.function?.name,
        arguments: call.arguments
      };
    } else if (typeof call.arguments === 'object') {
      // Convert object to JSON string
      return {
        id: call.id || `tool-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        name: call.name || call.function?.name,
        arguments: JSON.stringify(call.arguments)
      };
    } else {
      throw new Error(`Unsupported tool call format: ${JSON.stringify(call)}`);
    }
  });
}

/**
 * Format function definitions for provider compatibility
 * 
 * @param functions Function definitions
 * @returns Normalized function definitions
 */
export function normalizeFunctionDefinitions(
  functions?: FunctionDefinition[]
): FunctionDefinition[] {
  if (!functions || functions.length === 0) {
    return [];
  }

  return functions.map((fn) => ({
    name: fn.name,
    description: fn.description,
    parameters: fn.parameters
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
      throw new Error(`Message content must be a string: ${JSON.stringify(msg)}`);
    }
    
    // Handle each role type explicitly
    switch (msg.role) {
      case 'system':
        return {
          role: 'system',
          content: msg.content
        };
      case 'user':
        return {
          role: 'user',
          content: msg.content
        };
      case 'assistant':
        return {
          role: 'assistant',
          content: msg.content
        };
      case 'tool':
        return {
          role: 'tool',
          content: msg.content,
          name: msg.name || 'unknown_tool' // Ensure name is always present for tool messages
        };
      default:
        // Use type assertion for unknown roles
        console.warn(`Unexpected message role: ${String(msg.role)}, treating as user message`);
        return {
          role: 'user',
          content: msg.content
        };
    }
  });
}