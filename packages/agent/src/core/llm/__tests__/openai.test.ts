import { describe, expect, it, vi, beforeEach } from 'vitest';

import { TokenUsage } from '../../tokens.js';
import { OpenAIProvider } from '../providers/openai.js';

// Mock the OpenAI module
vi.mock('openai', () => {
  // Create a mock function for the create method
  const mockCreate = vi.fn().mockResolvedValue({
    id: 'chatcmpl-123',
    object: 'chat.completion',
    created: 1677858242,
    model: 'gpt-4',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: 'This is a test response',
          tool_calls: [
            {
              id: 'tool-call-1',
              type: 'function',
              function: {
                name: 'testFunction',
                arguments: '{"arg1":"value1"}',
              },
            },
          ],
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 20,
      total_tokens: 30,
    },
  });

  // Return a mocked version of the OpenAI class
  return {
    default: class MockOpenAI {
      constructor() {
        // Constructor implementation
      }

      chat = {
        completions: {
          create: mockCreate,
        },
      };
    },
  };
});

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    // Set environment variable for testing
    process.env.OPENAI_API_KEY = 'test-api-key';
    provider = new OpenAIProvider('gpt-4');
  });

  it('should initialize with correct properties', () => {
    expect(provider.name).toBe('openai');
    expect(provider.provider).toBe('openai.chat');
    expect(provider.model).toBe('gpt-4');
  });

  it('should generate text and handle tool calls', async () => {
    const response = await provider.generateText({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello, can you help me?' },
      ],
      functions: [
        {
          name: 'testFunction',
          description: 'A test function',
          parameters: {
            type: 'object',
            properties: {
              arg1: { type: 'string' },
            },
          },
        },
      ],
    });

    expect(response.text).toBe('This is a test response');
    expect(response.toolCalls).toHaveLength(1);

    const toolCall = response.toolCalls[0];
    expect(toolCall).toBeDefined();
    expect(toolCall?.name).toBe('testFunction');
    expect(toolCall?.id).toBe('tool-call-1');
    expect(toolCall?.content).toBe('{"arg1":"value1"}');

    // Check token usage
    expect(response.tokenUsage).toBeInstanceOf(TokenUsage);
    expect(response.tokenUsage.input).toBe(10);
    expect(response.tokenUsage.output).toBe(20);
  });

  it('should format messages correctly', async () => {
    await provider.generateText({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
        {
          role: 'tool_use',
          id: 'tool-1',
          name: 'testTool',
          content: '{"param":"value"}',
        },
        {
          role: 'tool_result',
          tool_use_id: 'tool-1',
          content: '{"result":"success"}',
          is_error: false,
        },
      ],
    });

    // Get the mock instance
    const client = provider['client'];
    const mockOpenAI = client?.chat?.completions
      ?.create as unknown as ReturnType<typeof vi.fn>;

    // Check that messages were formatted correctly
    expect(mockOpenAI).toHaveBeenCalled();

    // Get the second call arguments (from this test)
    const calledWith = mockOpenAI.mock.calls[1]?.[0] || {};

    expect(calledWith.messages).toHaveLength(5);

    // We need to check each message individually to avoid TypeScript errors
    const systemMessage = calledWith.messages[0];
    if (
      systemMessage &&
      typeof systemMessage === 'object' &&
      'role' in systemMessage
    ) {
      expect(systemMessage.role).toBe('system');
      expect(systemMessage.content).toBe('You are a helpful assistant.');
    }

    const userMessage = calledWith.messages[1];
    if (
      userMessage &&
      typeof userMessage === 'object' &&
      'role' in userMessage
    ) {
      expect(userMessage.role).toBe('user');
      expect(userMessage.content).toBe('Hello');
    }

    const assistantMessage = calledWith.messages[2];
    if (
      assistantMessage &&
      typeof assistantMessage === 'object' &&
      'role' in assistantMessage
    ) {
      expect(assistantMessage.role).toBe('assistant');
      expect(assistantMessage.content).toBe('Hi there');
    }

    // Check tool_use formatting
    const toolUseMessage = calledWith.messages[3];
    if (
      toolUseMessage &&
      typeof toolUseMessage === 'object' &&
      'role' in toolUseMessage
    ) {
      expect(toolUseMessage.role).toBe('assistant');
      expect(toolUseMessage.content).toBe(''); // required by gpustack' implementation of openai SDK.

      if (
        'tool_calls' in toolUseMessage &&
        Array.isArray(toolUseMessage.tool_calls)
      ) {
        expect(toolUseMessage.tool_calls.length).toBe(1);
        const toolCall = toolUseMessage.tool_calls[0];
        if (toolCall && 'function' in toolCall) {
          expect(toolCall.function.name).toBe('testTool');
        }
      }
    }

    // Check tool_result formatting
    const toolResultMessage = calledWith.messages[4];
    if (
      toolResultMessage &&
      typeof toolResultMessage === 'object' &&
      'role' in toolResultMessage
    ) {
      expect(toolResultMessage.role).toBe('tool');
      expect(toolResultMessage.content).toBe('{"result":"success"}');
      if ('tool_call_id' in toolResultMessage) {
        expect(toolResultMessage.tool_call_id).toBe('tool-1');
      }
    }
  });
});
