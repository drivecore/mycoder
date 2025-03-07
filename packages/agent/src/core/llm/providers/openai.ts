/**
 * OpenAI provider implementation
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

/**
 * OpenAI-specific options
 */
export interface OpenAIOptions extends ProviderOptions {
  apiKey?: string;
  organization?: string;
  baseUrl?: string;
}

/**
 * OpenAI provider implementation
 */
export class OpenAIProvider implements LLMProvider {
  name: string = 'openai';
  provider: string = 'openai.chat';
  model: string;
  private apiKey: string;
  private organization?: string;
  private baseUrl: string;

  constructor(model: string, options: OpenAIOptions = {}) {
    this.model = model;
    this.apiKey = options.apiKey || process.env.OPENAI_API_KEY || '';
    this.organization = options.organization || process.env.OPENAI_ORGANIZATION;
    this.baseUrl = options.baseUrl || 'https://api.openai.com/v1';
    
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required');
    }
  }

  /**
   * Generate text using OpenAI API
   */
  async generateText(options: GenerateOptions): Promise<LLMResponse> {
    const { messages, functions, temperature = 0.7, maxTokens, stopSequences } = options;
    
    const formattedMessages = this.formatMessages(messages);
    
    const requestBody: any = {
      model: this.model,
      messages: formattedMessages,
      temperature,
      ...(maxTokens && { max_tokens: maxTokens }),
      ...(stopSequences && { stop: stopSequences }),
    };
    
    // Add functions if provided
    if (functions && functions.length > 0) {
      requestBody.tools = functions.map(fn => ({
        type: 'function',
        function: {
          name: fn.name,
          description: fn.description,
          parameters: fn.parameters
        }
      }));
      requestBody.tool_choice = 'auto';
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...(this.organization && { 'OpenAI-Organization': this.organization }),
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      const toolCalls = data.choices[0]?.message?.tool_calls || [];
      
      return {
        text: content,
        toolCalls: normalizeToolCalls(toolCalls),
      };
    } catch (error) {
      throw new Error(`Error calling OpenAI API: ${(error as Error).message}`);
    }
  }

  /**
   * Count tokens in a text using OpenAI's tokenizer
   */
  async countTokens(text: string): Promise<number> {
    // This is a simplified implementation
    // In a real implementation, you would use a proper tokenizer
    // like tiktoken or GPT-3 Tokenizer
    return Math.ceil(text.length / 4);
  }

  /**
   * Format messages for OpenAI API
   */
  private formatMessages(messages: Message[]): any[] {
    return messages.map(msg => {
      const formatted: any = {
        role: msg.role,
        content: msg.content,
      };
      
      if (msg.name) {
        formatted.name = msg.name;
      }
      
      return formatted;
    });
  }
}