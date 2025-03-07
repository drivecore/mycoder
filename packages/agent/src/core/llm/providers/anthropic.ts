/**
 * Anthropic provider implementation
 */
import { LLMProvider } from '../provider.js';
import { 
  FunctionDefinition,
  GenerateOptions, 
  LLMResponse, 
  Message, 
  ProviderOptions, 
  ToolCall 
} from '../types.js';
import { normalizeToolCalls } from '../core.js';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Anthropic-specific options
 */
export interface AnthropicOptions extends ProviderOptions {
  apiKey?: string;
  baseUrl?: string;
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
    const { 
      messages, 
      functions, 
      temperature = 0.7, 
      maxTokens, 
      stopSequences,
      topP 
    } = options;
    
    // Extract system message
    const systemMessage = messages.find(msg => msg.role === 'system');
    const nonSystemMessages = messages.filter(msg => msg.role !== 'system');
    const formattedMessages = this.formatMessages(nonSystemMessages);
    
    try {
      const requestOptions: Anthropic.MessageCreateParams = {
        model: this.model,
        messages: formattedMessages,
        temperature,
        max_tokens: maxTokens || 1024,
        ...(stopSequences && { stop_sequences: stopSequences }),
        ...(topP && { top_p: topP }),
        ...(systemMessage && { system: systemMessage.content }),
      };

      // Add tools if provided
      if (functions && functions.length > 0) {
        (requestOptions as any).tools = functions.map(fn => ({
          name: fn.name,
          description: fn.description,
          input_schema: fn.parameters,
        }));
      }
      
      const response = await this.client.messages.create(requestOptions);
      
      // Extract content and tool calls
      const content = response.content.find(c => c.type === 'text')?.text || '';
      const toolCalls = response.content
        .filter(c => {
          const contentType = (c as any).type;
          return contentType === 'tool_use';
        })
        .map(c => {
          const toolUse = c as any;
          return {
            id: toolUse.id || `tool-${Math.random().toString(36).substring(2, 11)}`,
            name: toolUse.name,
            arguments: JSON.stringify(toolUse.input),
          };
        });
      
      return {
        text: content,
        toolCalls: toolCalls,
      };
    } catch (error) {
      throw new Error(`Error calling Anthropic API: ${(error as Error).message}`);
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
    return messages.map(msg => {
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
      } else if (msg.role === 'tool') {
        // Anthropic expects tool responses as an assistant message with tool_results
        return {
          role: 'assistant',
          content: [
            {
              type: 'tool_result',
              tool_use_id: msg.name, // Use name as the tool_use_id
              content: msg.content,
            }
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