/**
 * LLM Provider interface and factory
 */
import { GenerateOptions, LLMResponse } from './types.js';

/**
 * Interface for LLM providers
 */
export interface LLMProvider {
  /**
   * Provider name (e.g., 'openai', 'anthropic', etc.)
   */
  name: string;

  /**
   * Provider-specific identifier (e.g., 'openai.chat', 'anthropic.messages', etc.)
   */
  provider: string;

  /**
   * Model name (e.g., 'gpt-4', 'claude-3', etc.)
   */
  model: string;

  /**
   * Generate text using this provider
   *
   * @param options Generation options
   * @returns Response with text and/or tool calls
   */
  generateText(options: GenerateOptions): Promise<LLMResponse>;

  /**
   * Get the number of tokens in a given text
   *
   * @param text Text to count tokens for
   * @returns Number of tokens
   */
  countTokens(text: string): Promise<number>;
}

/**
 * Factory function to create a provider
 *
 * @param providerType Provider type (e.g., 'openai', 'anthropic')
 * @param model Model name
 * @param options Provider-specific options
 * @returns LLM provider instance
 */
export { createProvider, registerProvider } from './providers/index.js';
