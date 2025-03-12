import { describe, expect, it, vi } from 'vitest';

import { BackgroundTools } from '../../core/backgroundTools.js';
import { TokenTracker } from '../../core/tokens.js';
import { ToolContext } from '../../core/types.js';
import { MockLogger } from '../../utils/mockLogger.js';

import { subAgentTool } from './subAgent.js';

// Mock the toolAgent function
vi.mock('../../core/toolAgent/toolAgentCore.js', () => ({
  toolAgent: vi.fn().mockResolvedValue({
    result: 'Mock sub-agent result',
    interactions: 1,
  }),
}));

// Mock the getTools function
vi.mock('../getTools.js', () => ({
  getTools: vi.fn().mockReturnValue([{ name: 'mockTool' }]),
}));

// Mock context
const mockContext: ToolContext = {
  logger: new MockLogger(),
  tokenTracker: new TokenTracker(),
  workingDirectory: '/test',
  headless: true,
  userSession: false,
  pageFilter: 'none',
  githubMode: true,
  provider: 'anthropic',
  model: 'claude-3-7-sonnet-20250219',
  maxTokens: 4096,
  temperature: 0.7,
  backgroundTools: new BackgroundTools('test'),
};

describe('subAgentTool', () => {
  it('should create a sub-agent and return its response', async () => {
    const result = await subAgentTool.execute(
      {
        description: 'Test sub-agent',
        goal: 'Test the sub-agent tool',
        projectContext: 'Testing environment',
      },
      mockContext,
    );

    expect(result).toHaveProperty('response');
    expect(result.response).toBe('Mock sub-agent result');
  });

  it('should use custom working directory when provided', async () => {
    const { toolAgent } = await import('../../core/toolAgent/toolAgentCore.js');

    await subAgentTool.execute(
      {
        description: 'Test sub-agent with custom directory',
        goal: 'Test the sub-agent tool',
        projectContext: 'Testing environment',
        workingDirectory: '/custom/dir',
      },
      mockContext,
    );

    // Verify toolAgent was called with the custom working directory
    expect(toolAgent).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      expect.any(Object),
      expect.objectContaining({
        workingDirectory: '/custom/dir',
      }),
    );
  });

  it('should include relevant files in the prompt when provided', async () => {
    const { toolAgent } = await import('../../core/toolAgent/toolAgentCore.js');

    await subAgentTool.execute(
      {
        description: 'Test sub-agent with relevant files',
        goal: 'Test the sub-agent tool',
        projectContext: 'Testing environment',
        relevantFilesDirectories: 'src/**/*.ts',
      },
      mockContext,
    );

    // Verify toolAgent was called with a prompt containing the relevant files
    expect(toolAgent).toHaveBeenCalledWith(
      expect.stringContaining('Relevant Files'),
      expect.any(Array),
      expect.any(Object),
      expect.any(Object),
    );
  });
});
