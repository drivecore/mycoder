/**
 * Anthropic provider implementation
 */
import Anthropic from '@anthropic-ai/sdk';

import { TokenUsage } from '../../tokens.js';
import { LLMProvider } from '../provider.js';
import {
  GenerateOptions,
  LLMResponse,
  Message,
  ProviderOptions,
} from '../types.js';

const ANTHROPIC_CONTEXT_WINDOWS: Record<string, number> = {
  'claude-3-7-sonnet-20250219': 200000,
  'claude-3-7-sonnet-latest': 200000,
  'claude-3-5-sonnet-20241022': 200000,
  'claude-3-5-sonnet-latest': 200000,
  'claude-3-haiku-20240307': 200000,
  'claude-3-opus-20240229': 200000,
  'claude-3-sonnet-20240229': 200000,
  'claude-2.1': 100000,
  'claude-2.0': 100000,
  'claude-instant-1.2': 100000,
};

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
        content:
          i >= messages.length - 2
            ? [
                {
                  type: 'text',
                  text: m.content,
                  cache_control: { type: 'ephemeral' },
                },
              ]
            : m.content,
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

function tokenUsageFromMessage(
  message: Anthropic.Message,
  model: string,
  contextWindow: number | undefined,
) {
  const usage = new TokenUsage();
  usage.input = message.usage.input_tokens;
  usage.cacheWrites = message.usage.cache_creation_input_tokens ?? 0;
  usage.cacheReads = message.usage.cache_read_input_tokens ?? 0;
  usage.output = message.usage.output_tokens;

  const totalTokens = usage.input + usage.output;

  return {
    usage,
    totalTokens,
    contextWindow,
  };
}

/**
 * Anthropic provider implementation
 */
export class AnthropicProvider implements LLMProvider {
  name: string = 'anthropic';
  provider: string = 'anthropic.messages';
  model: string;
  options: AnthropicOptions;
  private client: Anthropic;
  private apiKey: string;
  private baseUrl?: string;

  constructor(model: string, options: AnthropicOptions = {}) {
    this.model = model;
    this.options = options;
    this.apiKey = options.apiKey ?? '';
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
    // Use configuration contextWindow if provided, otherwise use model-specific value
    let modelContextWindow = ANTHROPIC_CONTEXT_WINDOWS[this.model];
    if (!modelContextWindow && this.options.contextWindow) {
      modelContextWindow = this.options.contextWindow;
    }

    const { messages, functions, temperature = 0.7, maxTokens, topP } = options;

    // Extract system message
    const systemMessage = messages.find((msg) => msg.role === 'system');
    const nonSystemMessages = messages.filter((msg) => msg.role !== 'system');
    const formattedMessages = this.formatMessages(nonSystemMessages);

    const tools = addCacheControlToTools(
      (functions ?? []).map((fn) => ({
        name: fn.name,
        description: fn.description,
        input_schema: fn.parameters as Anthropic.Tool.InputSchema,
      })),
    );

    const requestOptions: Anthropic.MessageCreateParams = {
      model: this.model,
      messages: addCacheControlToMessages(formattedMessages),
      temperature,
      max_tokens: maxTokens || 1024,
      system: systemMessage?.content
        ? [
            {
              type: 'text',
              text: systemMessage?.content,
              cache_control: { type: 'ephemeral' },
            },
          ]
        : undefined,
      top_p: topP,
      tools,
      stream: false,
    };

    const response = await this.client.messages.create(requestOptions);

    // Extract content and tool calls
    const content = response.content.find((c) => c.type === 'text')?.text || '';
    const toolCalls = response.content
      .filter((c) => {
        const contentType = c.type;
        return contentType === 'tool_use';
      })
      .map((c) => {
        const toolUse = c as Anthropic.Messages.ToolUseBlock;
        return {
          id: toolUse.id,
          name: toolUse.name,
          content: JSON.stringify(toolUse.input),
        };
      });

    const tokenInfo = tokenUsageFromMessage(
      response,
      this.model,
      modelContextWindow,
    );

    return {
      text: content,
      toolCalls: toolCalls,
      tokenUsage: tokenInfo.usage,
      totalTokens: tokenInfo.totalTokens,
      contextWindow: tokenInfo.contextWindow,
    };
  }

  /**
   * Format messages for Anthropic API
   */
  private formatMessages(
    messages: Message[],
  ): Anthropic.Messages.MessageParam[] {
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
