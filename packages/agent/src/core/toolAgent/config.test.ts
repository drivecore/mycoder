import { describe, expect, it } from 'vitest';

import { createProvider } from '../llm/provider.js';

describe('createProvider', () => {
  it('should return the correct model for anthropic', () => {
    const model = createProvider('anthropic', 'claude-3-7-sonnet-20250219');
    expect(model).toBeDefined();
    expect(model.provider).toBe('anthropic.messages');
  });

  /*

  it('should return the correct model for openai', () => {
    const model = createProvider('openai', 'gpt-4o-2024-05-13');
    expect(model).toBeDefined();
    expect(model.provider).toBe('openai.chat');
  });

  it('should return the correct model for ollama', () => {
    const model = createProvider('ollama', 'llama3');
    expect(model).toBeDefined();
    expect(model.provider).toBe('ollama.chat');
  });

  it('should return the correct model for xai', () => {
    const model = createProvider('xai', 'grok-1');
    expect(model).toBeDefined();
    expect(model.provider).toBe('xai.chat');
  });

  it('should return the correct model for mistral', () => {
    const model = createProvider('mistral', 'mistral-large-latest');
    expect(model).toBeDefined();
    expect(model.provider).toBe('mistral.chat');
  });
*/

  it('should throw an error for unknown provider', () => {
    expect(() => {
      createProvider('unknown', 'model');
    }).toThrow();
  });
});
