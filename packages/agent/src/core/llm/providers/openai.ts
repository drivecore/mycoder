/**
 * OpenAI provider implementation
 */
import OpenAI from 'openai';

import { TokenUsage } from '../../tokens.js';
import { ToolCall } from '../../types';
import { LLMProvider } from '../provider.js';
import {
  GenerateOptions,
  LLMResponse,
  Message,
  ProviderOptions,
  FunctionDefinition,
} from '../types.js';

import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat';

/**
 * OpenAI-specific options
 */
export interface OpenAIOptions extends ProviderOptions {
  apiKey?: string;
  baseUrl?: string;
  organization?: string;
}

/**
 * OpenAI provider implementation
 */
export class OpenAIProvider implements LLMProvider {
  name: string = 'openai';
  provider: string = 'openai.chat';
  model: string;
  private client: OpenAI;
  private apiKey: string;
  private baseUrl?: string;
  private organization?: string;

  constructor(model: string, options: OpenAIOptions = {}) {
    this.model = model;
    this.apiKey = options.apiKey || process.env.OPENAI_API_KEY || '';
    this.baseUrl = options.baseUrl;
    this.organization = options.organization || process.env.OPENAI_ORGANIZATION;

    if (!this.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    console.log({
      provider: this.provider,
      model,
      apiKey: this.apiKey,
    });

    // Initialize OpenAI client
    this.client = new OpenAI({
      apiKey: this.apiKey,
      ...(this.baseUrl && { baseURL: this.baseUrl }),
      ...(this.organization && { organization: this.organization }),
    });
  }

  /**
   * Generate text using OpenAI API
   */
  async generateText(options: GenerateOptions): Promise<LLMResponse> {
    const {
      messages,
      functions,
      temperature = 0.7,
      maxTokens,
      stopSequences,
      topP,
      presencePenalty,
      frequencyPenalty,
      responseFormat,
    } = options;

    // Format messages for OpenAI
    const formattedMessages = this.formatMessages(messages);

    // Format functions for OpenAI
    const tools = functions ? this.formatFunctions(functions) : undefined;

    try {
      const requestOptions = {
        model: this.model,
        messages: formattedMessages,
        temperature,
        max_tokens: maxTokens,
        stop: stopSequences,
        top_p: topP,
        presence_penalty: presencePenalty,
        frequency_penalty: frequencyPenalty,
        tools: tools,
        response_format:
          responseFormat === 'json_object'
            ? { type: 'json_object' as const }
            : undefined,
      };

      const response =
        await this.client.chat.completions.create(requestOptions);

      // Extract content and tool calls
      const message = response.choices[0]?.message;
      const content = message?.content || '';

      // Handle tool calls if present
      const toolCalls: ToolCall[] = [];
      if (message?.tool_calls) {
        for (const tool of message.tool_calls) {
          if (tool.type === 'function') {
            toolCalls.push({
              id: tool.id,
              name: tool.function.name,
              content: tool.function.arguments,
            });
          }
        }
      }

      // Create token usage
      const tokenUsage = new TokenUsage();
      tokenUsage.input = response.usage?.prompt_tokens || 0;
      tokenUsage.output = response.usage?.completion_tokens || 0;

      return {
        text: content,
        toolCalls,
        tokenUsage,
      };
    } catch (error) {
      throw new Error(`Error calling OpenAI API: ${(error as Error).message}`);
    }
  }

  /**
   * Format messages for OpenAI API
   */
  private formatMessages(messages: Message[]): ChatCompletionMessageParam[] {
    return messages.map((msg): ChatCompletionMessageParam => {
      // Use switch for better type narrowing
      switch (msg.role) {
        case 'user':
          return {
            role: 'user',
            content: msg.content,
          };
        case 'system':
          return {
            role: 'system',
            content: msg.content,
          };
        case 'assistant':
          return {
            role: 'assistant',
            content: msg.content,
          };
        case 'tool_use':
          // OpenAI doesn't have a direct equivalent to tool_use,
          // so we'll include it as a function call in an assistant message
          return {
            role: 'assistant',
            content: null,
            tool_calls: [
              {
                id: msg.id,
                type: 'function' as const,
                function: {
                  name: msg.name,
                  arguments: msg.content,
                },
              },
            ],
          };
        case 'tool_result':
          // Tool results in OpenAI are represented as tool messages
          return {
            role: 'tool',
            content: msg.content,
            tool_call_id: msg.tool_use_id,
          };
        default:
          // For any other role, default to user message
          return {
            role: 'user',
            content: 'Unknown message type',
          };
      }
    });
  }

  /**
   * Format functions for OpenAI API
   */
  private formatFunctions(
    functions: FunctionDefinition[],
  ): ChatCompletionTool[] {
    return functions.map((fn) => ({
      type: 'function' as const,
      function: {
        name: fn.name,
        description: fn.description,
        parameters: fn.parameters,
      },
    }));
  }
}
