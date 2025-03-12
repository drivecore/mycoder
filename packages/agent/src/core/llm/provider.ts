/**
 * Provider registry and factory implementations
 */

import { AnthropicProvider } from './providers/anthropic.js';
import { OpenAIProvider } from './providers/openai.js';
import { ProviderOptions, GenerateOptions, LLMResponse } from './types.js';

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
}

// Provider factory registry
const providerFactories: Record<
  string,
  (model: string, options: ProviderOptions) => LLMProvider
> = {
  anthropic: (model, options) => new AnthropicProvider(model, options),
  openai: (model, options) => new OpenAIProvider(model, options),
};

/**
 * Create a provider instance
 */
export function createProvider(
  providerType: string,
  model: string,
  options: ProviderOptions = {},
): LLMProvider {
  console.log({ providerType, model, options });
  const factory = providerFactories[providerType.toLowerCase()];

  if (!factory) {
    throw new Error(
      `Provider '${providerType}' not found. Available providers: ${Object.keys(providerFactories).join(', ')}`,
    );
  }

  return factory(model, options);
}

/**
 * Register a new provider implementation
 */
export function registerProvider(
  providerType: string,
  factory: (model: string, options: ProviderOptions) => LLMProvider,
): void {
  providerFactories[providerType.toLowerCase()] = factory;
}
