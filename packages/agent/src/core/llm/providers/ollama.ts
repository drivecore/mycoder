/**
 * Ollama provider implementation
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
 * Ollama-specific options
 */
export interface OllamaOptions extends ProviderOptions {
  baseUrl?: string;
}

/**
 * Ollama provider implementation
 */
export class OllamaProvider implements LLMProvider {
  name: string = 'ollama';
  provider: string = 'ollama.chat';
  model: string;
  private baseUrl: string;

  constructor(model: string, options: OllamaOptions = {}) {
    this.model = model;
    this.baseUrl = options.baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

    // Ensure baseUrl doesn't end with a slash
    if (this.baseUrl.endsWith('/')) {
      this.baseUrl = this.baseUrl.slice(0, -1);
    }
  }

  /**
   * Generate text using Ollama API
   */
  async generateText(options: GenerateOptions): Promise<LLMResponse> {
    const { messages, functions, temperature = 0.7, maxTokens, topP, frequencyPenalty, presencePenalty } = options;

    // Format messages for Ollama API
    const formattedMessages = this.formatMessages(messages);

    try {
      // Prepare request options
      const requestOptions: any = {
        model: this.model,
        messages: formattedMessages,
        stream: false,
        options: {
          temperature: temperature,
          // Ollama uses top_k instead of top_p, but we'll include top_p if provided
          ...(topP !== undefined && { top_p: topP }),
          ...(frequencyPenalty !== undefined && { frequency_penalty: frequencyPenalty }),
          ...(presencePenalty !== undefined && { presence_penalty: presencePenalty }),
        },
      };

      // Add max_tokens if provided
      if (maxTokens !== undefined) {
        requestOptions.options.num_predict = maxTokens;
      }

      // Add functions/tools if provided
      if (functions && functions.length > 0) {
        requestOptions.tools = functions.map((fn) => ({
          name: fn.name,
          description: fn.description,
          parameters: fn.parameters,
        }));
      }

      // Make the API request
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestOptions),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();

      // Extract content and tool calls
      const content = data.message?.content || '';
      const toolCalls = data.message?.tool_calls?.map((toolCall: any) => ({
        id: toolCall.id || `tool-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        name: toolCall.name,
        content: JSON.stringify(toolCall.args || toolCall.arguments || {}),
      })) || [];

      // Create token usage from response data
      const tokenUsage = new TokenUsage();
      tokenUsage.input = data.prompt_eval_count || 0;
      tokenUsage.output = data.eval_count || 0;

      return {
        text: content,
        toolCalls: toolCalls,
        tokenUsage: tokenUsage,
      };
    } catch (error) {
      throw new Error(
        `Error calling Ollama API: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Format messages for Ollama API
   */
  private formatMessages(messages: Message[]): any[] {
    return messages.map((msg) => {
      if (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system') {
        return {
          role: msg.role,
          content: msg.content,
        };
      } else if (msg.role === 'tool_result') {
        // Ollama expects tool results as a 'tool' role
        return {
          role: 'tool',
          content: msg.content,
          tool_call_id: msg.tool_use_id,
        };
      } else if (msg.role === 'tool_use') {
        // We'll convert tool_use to assistant messages with tool_calls
        return {
          role: 'assistant',
          content: '',
          tool_calls: [
            {
              id: msg.id,
              name: msg.name,
              arguments: msg.content,
            },
          ],
        };
      }
      // Default fallback
      return {
        role: 'user',
        content: msg.content,
      };
    });
  }
}