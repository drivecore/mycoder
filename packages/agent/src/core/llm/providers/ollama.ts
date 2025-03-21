/**
 * Ollama provider implementation using the official Ollama npm package
 */

import {
  ChatRequest as OllamaChatRequest,
  ChatResponse as OllamaChatResponse,
  Ollama,
  ToolCall as OllamaTooCall,
  Tool as OllamaTool,
  Message as OllamaMessage,
} from 'ollama';

import { TokenUsage } from '../../tokens.js';
import { ToolCall } from '../../types.js';
// Define model context window sizes for Ollama models
// These are approximate and may vary based on specific model configurations
const OLLAMA_MODEL_LIMITS: Record<string, number> = {
  'llama2': 4096,
  'llama2-uncensored': 4096,
  'llama2:13b': 4096,
  'llama2:70b': 4096,
  'mistral': 8192,
  'mistral:7b': 8192,
  'mixtral': 32768,
  'codellama': 16384,
  'phi': 2048,
  'phi2': 2048,
  'openchat': 8192,
  // Add other models as needed
};
import { LLMProvider } from '../provider.js';
import {
  GenerateOptions,
  LLMResponse,
  Message,
  ProviderOptions,
  FunctionDefinition,
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
      maxTokens: requestMaxTokens,
      topP,
      frequencyPenalty,
      presencePenalty,
      stopSequences,
    } = options;

    // Format messages for Ollama API
    const formattedMessages = this.formatMessages(messages);

    // Prepare request options
    const requestOptions: OllamaChatRequest = {
      model: this.model,
      messages: formattedMessages,
      stream: false,
      options: {
        temperature: temperature,
        ...(topP !== undefined && { top_p: topP }),
        ...(frequencyPenalty !== undefined && {
          frequency_penalty: frequencyPenalty,
        }),
        ...(presencePenalty !== undefined && {
          presence_penalty: presencePenalty,
        }),
        ...(stopSequences &&
          stopSequences.length > 0 && { stop: stopSequences }),
      },
    };

    // Add max_tokens if provided
    if (requestMaxTokens !== undefined) {
      requestOptions.options = {
        ...requestOptions.options,
        num_predict: requestMaxTokens,
      };
    }

    // Add functions/tools if provided
    if (functions && functions.length > 0) {
      requestOptions.tools = this.convertFunctionsToTools(functions);
    }

    // Make the API request using the Ollama client
    const response: OllamaChatResponse = await this.client.chat({
      ...requestOptions,
      stream: false,
    });

    // Extract content and tool calls
    const content = response.message?.content || '';

    // Handle tool calls if present
    const toolCalls = this.extractToolCalls(response);

    // Create token usage from response data
    const tokenUsage = new TokenUsage();
    tokenUsage.output = response.eval_count || 0;
    tokenUsage.input = response.prompt_eval_count || 0;
    
    // Calculate total tokens and get max tokens for the model
    const totalTokens = tokenUsage.input + tokenUsage.output;
    
    // Extract the base model name without specific parameters
    const baseModelName = this.model.split(':')[0];
    // Check if model exists in limits, otherwise use base model or default
    const modelMaxTokens = OLLAMA_MODEL_LIMITS[this.model] || 
                          (baseModelName ? OLLAMA_MODEL_LIMITS[baseModelName] : undefined) || 
                          4096; // Default fallback

    return {
      text: content,
      toolCalls: toolCalls,
      tokenUsage: tokenUsage,
      totalTokens,
      maxTokens: modelMaxTokens,
    };
  }

  /*
  interface Tool {
    type: string;
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            required: string[];
            properties: {
                [key: string]: {
                    type: string;
                    description: string;
                    enum?: string[];
                };
            };
        };
    };
}*/

  /**
   * Convert our function definitions to Ollama tool format
   */
  private convertFunctionsToTools(
    functions: FunctionDefinition[],
  ): OllamaTool[] {
    return functions.map(
      (fn) =>
        ({
          type: 'function',
          function: {
            name: fn.name,
            description: fn.description,
            parameters: fn.parameters,
          },
        }) as OllamaTool,
    );
  }

  /**
   * Extract tool calls from Ollama response
   */
  private extractToolCalls(response: OllamaChatResponse): ToolCall[] {
    if (!response.message?.tool_calls) {
      return [];
    }

    return response.message.tool_calls.map((toolCall: OllamaTooCall) => {
      return {
        id: `tool-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        name: toolCall.function?.name,
        content:
          typeof toolCall.function?.arguments === 'string'
            ? toolCall.function.arguments
            : JSON.stringify(toolCall.function?.arguments || {}),
      };
    });
  }

  /**
   * Format messages for Ollama API
   */
  private formatMessages(messages: Message[]): OllamaMessage[] {
    const output: OllamaMessage[] = [];

    messages.forEach((msg) => {
      switch (msg.role) {
        case 'user':
        case 'assistant':
        case 'system':
          output.push({
            role: msg.role,
            content: msg.content,
          } satisfies OllamaMessage);
          break;
        case 'tool_result':
          // Ollama expects tool results as a 'tool' role
          output.push({
            role: 'tool',
            content:
              typeof msg.content === 'string'
                ? msg.content
                : JSON.stringify(msg.content),
          } as OllamaMessage);
          break;
        case 'tool_use': {
          // So there is an issue here is that ollama expects tool calls to be part of the assistant message
          // get last message and add tool call to it
          const lastMessage: OllamaMessage = output[output.length - 1]!;
          lastMessage.tool_calls = [
            {
              function: {
                name: msg.name,
                arguments: JSON.parse(msg.content),
              },
            },
          ];
          break;
        }
      }
    });

    return output;
  }
}
