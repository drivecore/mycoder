import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { MockLogger } from '../utils/mockLogger.js';

import { executeToolCall } from './executeToolCall.js';
import { TokenTracker } from './tokens.js';
import { toolAgent } from './toolAgent.js';
import { Tool, ToolContext } from './types.js';

// Mock the AnthropicProvider
vi.mock('./llm/anthropic.js', () => ({
  AnthropicProvider: class {
    constructor() {}
    sendRequest = vi.fn().mockImplementation(() => ({
      content: [
        {
          type: 'tool_use',
          name: 'sequenceComplete',
          id: '1',
          input: { result: 'Test complete' },
        },
      ],
      toolCalls: [
        {
          type: 'tool_use',
          name: 'sequenceComplete',
          id: '1',
          input: { result: 'Test complete' },
        },
      ],
    }))
  },
}));

const toolContext: ToolContext = {
  logger: new MockLogger(),
  headless: true,
  workingDirectory: '.',
  userSession: false,
  pageFilter: 'simple',
  tokenTracker: new TokenTracker(),
};

// Mock configuration for testing
const testConfig = {
  maxIterations: 50,
  model: 'claude-3-7-sonnet-latest',
  maxTokens: 4096,
  temperature: 0.7,
  getSystemPrompt: () => 'Test system prompt',
};

describe('toolAgent', () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Mock tool for testing
  const mockTool: Tool = {
    name: 'mockTool',
    description: 'A mock tool for testing',
    parameters: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description: 'Test input',
        },
      },
      required: ['input'],
    },
    returns: {
      type: 'string',
      description: 'The processed result',
    },
    execute: ({ input }) => Promise.resolve(`Processed: ${input}`),
  };

  const sequenceCompleteTool: Tool = {
    name: 'sequenceComplete',
    description: 'Completes the sequence',
    parameters: {
      type: 'object',
      properties: {
        result: {
          type: 'string',
          description: 'The final result',
        },
      },
      required: ['result'],
    },
    returns: {
      type: 'string',
      description: 'The final result',
    },
    execute: ({ result }) => Promise.resolve(result),
  };

  it('should execute tool calls', async () => {
    const result = await executeToolCall(
      {
        id: '1',
        name: 'mockTool',
        input: { input: 'test' },
      },
      [mockTool],
      toolContext,
    );

    expect(result.includes('Processed: test')).toBeTruthy();
  });

  it('should handle unknown tools', async () => {
    await expect(
      executeToolCall(
        {
          id: '1',
          name: 'nonexistentTool',
          input: {},
        },
        [mockTool],
        toolContext,
      ),
    ).rejects.toThrow("No tool with the name 'nonexistentTool' exists.");
  });

  it('should handle tool execution errors', async () => {
    const errorTool: Tool = {
      name: 'errorTool',
      description: 'A tool that always fails',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
      returns: {
        type: 'string',
        description: 'Error message',
      },
      execute: () => {
        throw new Error('Deliberate failure');
      },
    };

    await expect(
      executeToolCall(
        {
          id: '1',
          name: 'errorTool',
          input: {},
        },
        [errorTool],
        toolContext,
      ),
    ).rejects.toThrow('Deliberate failure');
  });

  // Test the toolAgent with the mocked AnthropicProvider
  it('should complete a sequence', async () => {
    const result = await toolAgent(
      'Test prompt',
      [sequenceCompleteTool],
      testConfig,
      toolContext,
    );

    expect(result.result).toBe('Test complete');
  });

  // New tests for async system prompt
  it('should handle async system prompt', async () => {
    const result = await toolAgent(
      'Test prompt',
      [sequenceCompleteTool],
      testConfig,
      toolContext,
    );

    expect(result.result).toBe('Test complete');
  });
});
