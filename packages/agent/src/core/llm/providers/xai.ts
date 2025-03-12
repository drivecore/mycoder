/**
 * XAI (Grok) provider implementation
 */
import { TokenUsage } from '../../tokens.js';
import { LLMProvider } from '../provider.js';
import {
  GenerateOptions,
  LLMResponse,
  Message,
  ProviderOptions,
} from '../types.js';

/**
 * XAI-specific options
 */
export interface XAIOptions extends ProviderOptions {
  apiKey?: string;
  baseUrl?: string;
}

/**
 * XAI provider implementation
 */
export class XAIProvider implements LLMProvider {
  name: string = 'xai';
  provider: string = 'xai.chat';
  model: string;
  private apiKey: string;
  private baseUrl: string;

  constructor(model: string, options: XAIOptions = {}) {
    this.model = model;
    this.apiKey = options.apiKey || process.env.XAI_API_KEY || '';
    this.baseUrl = options.baseUrl || 'https://api.x.ai/v1';

    if (!this.apiKey) {
      throw new Error('XAI API key is required');
    }
  }

  /**
   * Generate text using XAI API
   */
  async generateText(options: GenerateOptions): Promise<LLMResponse> {
    const { messages, functions, temperature = 0.7, maxTokens, topP } = options;

    // Extract system message
    const systemMessage = messages.find((msg) => msg.role === 'system');
    const nonSystemMessages = messages.filter((msg) => msg.role !== 'system');
    const formattedMessages = this.formatMessages(nonSystemMessages);

    // Format tools for XAI API
    const tools = functions
      ? [
          {
            type: 'function',
            functions: functions.map((fn) => ({
              name: fn.name,
              description: fn.description,
              parameters: fn.parameters,
            })),
          },
        ]
      : undefined;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            ...(systemMessage
              ? [{ role: 'system', content: systemMessage.content }]
              : []),
            ...formattedMessages,
          ],
          temperature,
          max_tokens: maxTokens || 1024,
          top_p: topP,
          tools,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `XAI API error: ${errorData.error || response.statusText}`,
        );
      }

      const data = await response.json();

      // Extract content and tool calls
      const content = data.choices[0]?.message?.content || '';
      const toolCalls = data.choices[0]?.message?.tool_calls?.map((toolCall) => ({
        id: toolCall.id,
        name: toolCall.function.name,
        content: JSON.stringify(toolCall.function.arguments),
      })) || [];

      // Create token usage object
      const tokenUsage = new TokenUsage();
      if (data.usage) {
        tokenUsage.input = data.usage.prompt_tokens;
        tokenUsage.output = data.usage.completion_tokens;
      }

      return {
        text: content,
        toolCalls,
        tokenUsage,
      };
    } catch (error) {
      throw new Error(`Error calling XAI API: ${(error as Error).message}`);
    }
  }

  /**
   * Format messages for XAI API
   */
  private formatMessages(messages: Message[]): any[] {
    // Format messages for XAI API (follows OpenAI format)
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
        // Format tool results as OpenAI tool results
        return {
          role: 'tool',
          tool_call_id: msg.tool_use_id,
          content: msg.content,
        };
      } else if (msg.role === 'tool_use') {
        // Tool use messages are formatted as assistant messages with tool_calls
        return {
          role: 'assistant',
          content: null,
          tool_calls: [
            {
              id: msg.id,
              type: 'function',
              function: {
                name: msg.name,
                arguments: msg.content,
              },
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