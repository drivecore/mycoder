/**
 * Anthropic provider implementation
 */
import Anthropic from '@anthropic-ai/sdk';

import { LLMProvider } from '../provider.js';
import {
  GenerateOptions,
  LLMResponse,
  Message,
  ProviderOptions,
} from '../types.js';

/**
 * Anthropic-specific options
 */
export interface AnthropicOptions extends ProviderOptions {
  apiKey?: string;
  baseUrl?: string;
}

// a function that takes a list of messages and returns a list of messages but with the last message having a cache_control of ephemeral
function addCacheControlToTools<T>(messages: T[]): T[] {
  return messages.map((m, i) => ({
    ...m,
    ...(i === messages.length - 1
      ? { cache_control: { type: 'ephemeral' } }
      : {}),
  }));
}

function addCacheControlToContentBlocks(
  content: Anthropic.Messages.TextBlock[],
): Anthropic.Messages.TextBlock[] {
  return content.map((c, i) => {
    if (i === content.length - 1) {
      if (
        c.type === 'text' ||
        c.type === 'document' ||
        c.type === 'image' ||
        c.type === 'tool_use' ||
        c.type === 'tool_result' ||
        c.type === 'thinking' ||
        c.type === 'redacted_thinking'
      ) {
        return { ...c, cache_control: { type: 'ephemeral' } };
      }
    }
    return c;
  });
}
function addCacheControlToMessages(
  messages: Anthropic.Messages.MessageParam[],
): Anthropic.Messages.MessageParam[] {
  return messages.map((m, i) => {
    if (typeof m.content === 'string') {
      return {
        ...m,
        content: [
          {
            type: 'text',
            text: m.content,
            cache_control: { type: 'ephemeral' },
          },
        ],
      };
    }
    return {
      ...m,
      content:
        i >= messages.length - 2
          ? addCacheControlToContentBlocks(
              m.content as Anthropic.Messages.TextBlock[],
            )
          : m.content,
    };
  });
}

/**
 * Anthropic provider implementation
 */
export class AnthropicProvider implements LLMProvider {
  name: string = 'anthropic';
  provider: string = 'anthropic.messages';
  model: string;
  private client: Anthropic;
  private apiKey: string;
  private baseUrl?: string;

  constructor(model: string, options: AnthropicOptions = {}) {
    this.model = model;
    this.apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.baseUrl = options.baseUrl;

    if (!this.apiKey) {
      throw new Error('Anthropic API key is required');
    }

    // Initialize Anthropic client
    this.client = new Anthropic({
      apiKey: this.apiKey,
      ...(this.baseUrl && { baseURL: this.baseUrl }),
    });
  }

  /**
   * Generate text using Anthropic API
   */
  async generateText(options: GenerateOptions): Promise<LLMResponse> {
    const { messages, functions, temperature = 0.7, maxTokens, topP } = options;

    // Extract system message
    const systemMessage = messages.find((msg) => msg.role === 'system');
    const nonSystemMessages = messages.filter((msg) => msg.role !== 'system');
    const formattedMessages = this.formatMessages(nonSystemMessages);

    try {
      const requestOptions: Anthropic.MessageCreateParams = {
        model: this.model,
        messages: addCacheControlToMessages(formattedMessages),
        temperature,
        max_tokens: maxTokens || 1024,
        system: systemMessage?.content,
        top_p: topP,
        stream: false,
      };

      // Add tools if provided
      if (functions && functions.length > 0) {
        const tools = functions.map((fn) => ({
          name: fn.name,
          description: fn.description,
          input_schema: fn.parameters,
        }));
        (requestOptions as any).tools = addCacheControlToTools(tools);
      }

      const response = await this.client.messages.create(requestOptions);

      // Extract content and tool calls
      const content =
        response.content.find((c) => c.type === 'text')?.text || '';
      const toolCalls = response.content
        .filter((c) => {
          const contentType = (c as any).type;
          return contentType === 'tool_use';
        })
        .map((c) => {
          const toolUse = c as any;
          return {
            id:
              toolUse.id ||
              `tool-${Math.random().toString(36).substring(2, 11)}`,
            name: toolUse.name,
            content: JSON.stringify(toolUse.input),
          };
        });

      return {
        text: content,
        toolCalls: toolCalls,
      };
    } catch (error) {
      throw new Error(
        `Error calling Anthropic API: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Count tokens in a text using Anthropic's tokenizer
   * Note: This is a simplified implementation
   */
  async countTokens(text: string): Promise<number> {
    // In a real implementation, you would use Anthropic's tokenizer
    // This is a simplified approximation
    return Math.ceil(text.length / 3.5);
  }

  /**
   * Format messages for Anthropic API
   */
  private formatMessages(messages: Message[]): any[] {
    // Format messages for Anthropic API
    return messages.map((msg) => {
      if (msg.role === 'user') {
        return {
          role: 'user',
          content: msg.content,
        };
      } else if (msg.role === 'assistant') {
        return {
          role: 'assistant',
          content: msg.content,
        };
      } else if (msg.role === 'tool_result') {
        // Anthropic expects tool responses as an assistant message with tool_results
        return {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: msg.tool_use_id, // Use name as the tool_use_id
              content: msg.content,
              is_error: msg.is_error,
            },
          ],
        };
      } else if (msg.role === 'tool_use') {
        return {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              name: msg.name,
              id: msg.id,
              input: JSON.parse(msg.content),
            },
          ],
        };
      }
      return {
        role: 'user',
        content: msg.content,
      };
    });
  }
}
