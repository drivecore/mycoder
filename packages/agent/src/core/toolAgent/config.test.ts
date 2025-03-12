import { describe, expect, it } from 'vitest';

import { getModel } from './config';

describe('getModel', () => {
  it('should return the correct model for anthropic', () => {
    const model = getModel('anthropic', 'claude-3-7-sonnet-20250219');
    expect(model).toBeDefined();
    expect(model.provider).toBe('anthropic.messages');
  });

  it('should return the correct model for ollama', () => {
    const model = getModel('ollama', 'llama3');
    expect(model).toBeDefined();
    expect(model.provider).toBe('ollama.chat');
  });

  it('should return the correct model for ollama with custom base URL', () => {
    const model = getModel('ollama', 'llama3', {
      ollamaBaseUrl: 'http://custom-ollama:11434',
    });
    expect(model).toBeDefined();
    expect(model.provider).toBe('ollama.chat');
  });

  /*
  it('should return the correct model for openai', () => {
    const model = getModel('openai', 'gpt-4o-2024-05-13');
    expect(model).toBeDefined();
    expect(model.provider).toBe('openai.chat');
  });

  it('should return the correct model for xai', () => {
    const model = getModel('xai', 'grok-1');
    expect(model).toBeDefined();
    expect(model.provider).toBe('xai.chat');
  });

  it('should return the correct model for mistral', () => {
    const model = getModel('mistral', 'mistral-large-latest');
    expect(model).toBeDefined();
    expect(model.provider).toBe('mistral.chat');
  });
  */

  it('should throw an error for unknown provider', () => {
    expect(() => {
      // @ts-expect-error Testing invalid provider
      getModel('unknown', 'model');
    }).toThrow('Unknown model provider: unknown');
  });
});
