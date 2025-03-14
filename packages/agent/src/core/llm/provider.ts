/**
 * Provider registry and factory implementations
 */

import { AnthropicProvider } from './providers/anthropic.js';
import { OllamaProvider } from './providers/ollama.js';
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

export type ProviderConfig = {
  keyName?: string;
  docsUrl?: string;
  baseUrl?: string;
  model: string;
  factory: (model: string, options: ProviderOptions) => LLMProvider;
};

// Provider factory registry
export const providerConfig: Record<string, ProviderConfig> = {
  anthropic: {
    keyName: 'ANTHROPIC_API_KEY',
    docsUrl: 'https://mycoder.ai/docs/provider/anthropic',
    model: 'claude-3-7-sonnet-20250219',
    factory: (model, options) => new AnthropicProvider(model, options),
  },
  openai: {
    keyName: 'OPENAI_API_KEY',
    docsUrl: 'https://mycoder.ai/docs/provider/openai',
    model: 'gpt-4o-2024-05-13',
    factory: (model, options) => new OpenAIProvider(model, options),
  },
  ollama: {
    docsUrl: 'https://mycoder.ai/docs/provider/ollama',
    model: 'llama3.2',
    baseUrl: 'http://localhost:11434',
    factory: (model, options) => new OllamaProvider(model, options),
  },
  'local-openai': {
    docsUrl: 'https://mycoder.ai/docs/provider/local-openai',
    model: 'llama3.2',
    baseUrl: 'http://localhost:80',
    factory: (model, options) => new OpenAIProvider(model, options),
  },
  xai: {
    keyName: 'XAI_API_KEY',
    docsUrl: 'https://mycoder.ai/docs/provider/xai',
    baseUrl: 'https://api.x.ai/v1',
    model: 'grok-2-latest',
    factory: (model, options) => new OpenAIProvider(model, options),
  },
};

/**
 * Create a provider instance
 */
export function createProvider(
  provider: string,
  model?: string,
  options: ProviderOptions = {},
): LLMProvider {
  const config = providerConfig[provider];

  if (!config) {
    throw new Error(
      `Provider '${provider}' not found. Available providers: ${Object.keys(providerConfig).join(', ')}`,
    );
  }

  return config.factory(model ?? config.model, {
    ...options,
    baseUrl: options.baseUrl ?? config.baseUrl,
  });
}
