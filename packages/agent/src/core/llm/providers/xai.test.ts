import { beforeEach, describe, expect, it, vi } from 'vitest';

import { XAIProvider } from './xai.js';

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn(),
      },
    })),
  };
});

describe('XAIProvider', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks();

    // Set environment variable
    process.env.XAI_API_KEY = 'test-api-key';
  });

  it('should initialize with model and API key', () => {
    const provider = new XAIProvider('grok-2-1212');
    expect(provider.name).toBe('xai');
    expect(provider.provider).toBe('xai.chat');
    expect(provider.model).toBe('grok-2-1212');
  });

  it('should throw error if API key is not provided', () => {
    delete process.env.XAI_API_KEY;
    expect(() => new XAIProvider('grok-2-1212')).toThrow('XAI API key is required');
  });
});