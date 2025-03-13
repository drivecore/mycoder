/**
 * Ollama provider implementation using the official Ollama npm package
 */

import ollama, { Ollama, ChatResponse, Tool } from 'ollama';
import { TokenUsage } from '../../tokens.js';
import { LLMProvider } from '../provider.js';
import {
  FunctionDefinition,
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
 * Ollama provider implementation using the official Ollama npm package
 */
export class OllamaProvider implements LLMProvider {
  name: string = 'ollama';
  provider: string = 'ollama.chat';
  model: string;
  private client: Ollama;

  constructor(model: string, options: OllamaOptions = {}) {
    this.model = model;
    const baseUrl = 
      options.baseUrl || 
      process.env.OLLAMA_BASE_URL || 
      'http://localhost:11434';

    this.client = new Ollama({ host: baseUrl });
  }

  /**
   * Generate text using Ollama API via the official npm package
   */
  async generateText(options: GenerateOptions): Promise<LLMResponse> {
    const {
      messages,
      functions,
      temperature = 0.7,
      maxTokens,
      topP,
      frequencyPenalty,
      presencePenalty,
      stopSequences,
    } = options;

    // Format messages for Ollama API
    const formattedMessages = this.formatMessages(messages);

    try {
      // Prepare chat options
      const ollamaOptions: Record<string, any> = {
        temperature,
      };
      
      // Add optional parameters if provided
      if (topP !== undefined) ollamaOptions.top_p = topP;
      if (frequencyPenalty !== undefined) ollamaOptions.frequency_penalty = frequencyPenalty;
      if (presencePenalty !== undefined) ollamaOptions.presence_penalty = presencePenalty;
      if (maxTokens !== undefined) ollamaOptions.num_predict = maxTokens;
      if (stopSequences && stopSequences.length > 0) ollamaOptions.stop = stopSequences;

      // Prepare request parameters
      const requestParams: any = {
        model: this.model,
        messages: formattedMessages,
        stream: false,
        options: ollamaOptions,
      };

      // Add functions/tools if provided
      if (functions && functions.length > 0) {
        requestParams.tools = this.convertFunctionsToTools(functions);
      }

      // Make the API request using the Ollama client
      const response = await this.client.chat(requestParams);

      // Extract content from response
      const content = response.message?.content || '';
      
      // Process tool calls if present
      const toolCalls = this.processToolCalls(response);

      // Create token usage from response data
      const tokenUsage = new TokenUsage();
      if (response.prompt_eval_count) {
        tokenUsage.input = response.prompt_eval_count;
      }
      if (response.eval_count) {
        tokenUsage.output = response.eval_count;
      }

      return {
        text: content,
        toolCalls: toolCalls,
        tokenUsage: tokenUsage,
      };
    } catch (error) {
      throw new Error(`Error calling Ollama API: ${(error as Error).message}`);
    }
  }

  /**
   * Convert our FunctionDefinition format to Ollama's Tool format
   */
  private convertFunctionsToTools(functions: FunctionDefinition[]): Tool[] {
    return functions.map((fn) => ({
      type: 'function',
      function: {
        name: fn.name,
        description: fn.description,
        parameters: fn.parameters,
      }
    }));
  }

  /**
   * Process tool calls from the Ollama response
   */
  private processToolCalls(response: ChatResponse): any[] {
    if (!response.message?.tool_calls || response.message.tool_calls.length === 0) {
      return [];
    }

    return response.message.tool_calls.map((toolCall) => ({
      id: toolCall.function?.name 
        ? `tool-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
        : toolCall.id,
      name: toolCall.function?.name,
      content: JSON.stringify(toolCall.function?.arguments || {}),
    }));
  }

  /**
   * Format messages for Ollama API
   */
  private formatMessages(messages: Message[]): any[] {
    return messages.map((msg) => {
      if (
        msg.role === 'user' ||
        msg.role === 'assistant' ||
        msg.role === 'system'
      ) {
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
              function: {
                name: msg.name,
                arguments: msg.content,
              }
            },
          ],
        };
      }
      // Default fallback for unknown message types
      return {
        role: 'user',
        content: (msg as any).content || '',
      };
    });
  }
}