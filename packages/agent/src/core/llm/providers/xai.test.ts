import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TokenUsage } from '../../tokens.js';
import { XAIProvider } from './xai.js';

// Mock fetch
vi.stubGlobal('fetch', vi.fn());

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

  it('should generate text successfully', async () => {
    const mockResponse = {
      id: 'mock-id',
      model: 'grok-2-1212',
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'Hello, how can I help you?',
          },
          finish_reason: 'stop',
          index: 0,
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
      },
    };

    // Mock fetch to return the expected response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const provider = new XAIProvider('grok-2-1212');
    const result = await provider.generateText({
      messages: [
        { role: 'user', content: 'Hello' },
      ],
      temperature: 0.7,
    });

    expect(result).toEqual({
      text: 'Hello, how can I help you?',
      toolCalls: [],
      tokenUsage: expect.any(TokenUsage),
    });

    expect(result.tokenUsage.input).toBe(10);
    expect(result.tokenUsage.output).toBe(5);

    // Verify the fetch call
    expect(fetch).toHaveBeenCalledWith(
      'https://api.x.ai/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-api-key',
        },
        body: expect.any(String),
      }),
    );

    // Verify the request body
    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const fetchOptions = fetchCall?.[1];
    const requestBody = fetchOptions?.body ? JSON.parse(fetchOptions.body as string) : {};
    
    expect(requestBody).toEqual({
      model: 'grok-2-1212',
      messages: [{ role: 'user', content: 'Hello' }],
      temperature: 0.7,
      max_tokens: 1024,
    });
  });

  it('should handle tool calls correctly', async () => {
    const mockResponse = {
      id: 'mock-id',
      model: 'grok-2-1212',
      choices: [
        {
          message: {
            role: 'assistant',
            content: '',
            tool_calls: [
              {
                id: 'call_123',
                type: 'function',
                function: {
                  name: 'get_weather',
                  arguments: '{"location":"New York"}',
                },
              },
            ],
          },
          finish_reason: 'tool_calls',
          index: 0,
        },
      ],
      usage: {
        prompt_tokens: 20,
        completion_tokens: 15,
        total_tokens: 35,
      },
    };

    // Mock fetch to return the expected response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const provider = new XAIProvider('grok-2-1212');
    const result = await provider.generateText({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'What is the weather in New York?' },
      ],
      functions: [
        {
          name: 'get_weather',
          description: 'Get the weather for a location',
          parameters: {
            type: 'object',
            properties: {
              location: {
                type: 'string',
                description: 'The location to get weather for',
              },
            },
            required: ['location'],
          },
        },
      ],
    });

    // We're just checking that the structure is correct
    expect(result.text).toBe('');
    expect(result.toolCalls).toHaveLength(1);
    
    const firstToolCall = result.toolCalls[0];
    expect(firstToolCall?.id).toBe('call_123');
    expect(firstToolCall?.name).toBe('get_weather');
    
    expect(result.tokenUsage).toBeInstanceOf(TokenUsage);

    // Verify the fetch call
    expect(fetch).toHaveBeenCalledWith(
      'https://api.x.ai/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
      }),
    );

    // Verify the request body
    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const fetchOptions = fetchCall?.[1];
    const requestBody = fetchOptions?.body ? JSON.parse(fetchOptions.body as string) : {};
    
    expect(requestBody.messages).toEqual([
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is the weather in New York?' },
    ]);
    expect(requestBody.tools).toEqual([
      {
        type: 'function',
        functions: [
          {
            name: 'get_weather',
            description: 'Get the weather for a location',
            parameters: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: 'The location to get weather for',
                },
              },
              required: ['location'],
            },
          },
        ],
      },
    ]);
  });

  it('should handle API errors', async () => {
    // Mock fetch to return an error
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({
        error: 'Invalid API key',
      }),
    } as Response);

    const provider = new XAIProvider('grok-2-1212');
    
    await expect(
      provider.generateText({
        messages: [{ role: 'user', content: 'Hello' }],
      })
    ).rejects.toThrow('Error calling XAI API: XAI API error: Invalid API key');
  });

  it('should format messages correctly', async () => {
    // Mock fetch to return a success response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Response' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5 },
      }),
    } as Response);

    const provider = new XAIProvider('grok-2-1212');
    
    await provider.generateText({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { 
          role: 'tool_use', 
          name: 'get_weather', 
          id: 'call_123',
          content: '{"location":"New York"}' 
        },
        { 
          role: 'tool_result', 
          tool_use_id: 'call_123',
          content: '{"temperature": 72, "condition": "sunny"}',
          is_error: false
        },
      ],
    });

    // Verify the request body
    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const fetchOptions = fetchCall?.[1];
    const requestBody = fetchOptions?.body ? JSON.parse(fetchOptions.body as string) : {};
    
    expect(requestBody.messages).toEqual([
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
      { 
        role: 'assistant', 
        content: null,
        tool_calls: [
          {
            id: 'call_123',
            type: 'function',
            function: {
              name: 'get_weather',
              arguments: '{"location":"New York"}',
            },
          },
        ],
      },
      { 
        role: 'tool', 
        tool_call_id: 'call_123',
        content: '{"temperature": 72, "condition": "sunny"}',
      },
    ]);
  });
});