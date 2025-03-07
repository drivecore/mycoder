/**
 * Provider registry and factory implementations
 */
import { LLMProvider } from '../provider.js';
import { ProviderOptions } from '../types.js';
import { OpenAIProvider } from './openai.js';
import { AnthropicProvider } from './anthropic.js';

// Provider factory registry
const providerFactories: Record<string, (model: string, options: ProviderOptions) => LLMProvider> = {
  openai: (model, options) => new OpenAIProvider(model, options),
  anthropic: (model, options) => new AnthropicProvider(model, options),
};

/**
 * Create a provider instance
 */
export function createProvider(
  providerType: string,
  model: string,
  options: ProviderOptions = {}
): LLMProvider {
  const factory = providerFactories[providerType.toLowerCase()];
  
  if (!factory) {
    throw new Error(`Provider '${providerType}' not found. Available providers: ${Object.keys(providerFactories).join(', ')}`);
  }
  
  return factory(model, options);
}

/**
 * Register a new provider implementation
 */
export function registerProvider(
  providerType: string,
  factory: (model: string, options: ProviderOptions) => LLMProvider
): void {
  providerFactories[providerType.toLowerCase()] = factory;
}