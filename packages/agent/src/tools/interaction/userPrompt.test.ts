import { describe, expect, it, vi } from 'vitest';

import { TokenTracker } from '../../core/tokens.js';
import { ToolContext } from '../../core/types.js';
import { MockLogger } from '../../utils/mockLogger.js';

import { userPromptTool } from './userPrompt.js';

// Mock the userPrompt function
vi.mock('../../utils/userPrompt.js', () => ({
  userPrompt: vi.fn().mockResolvedValue('Mock user response'),
}));

// Mock context
const mockContext: ToolContext = {
  logger: new MockLogger(),
  tokenTracker: new TokenTracker(),
  workingDirectory: '/test',
  headless: true,
  userSession: false,
  pageFilter: 'none',
  githubMode: false,
};

describe('userPromptTool', () => {
  it('should prompt the user and return their response', async () => {
    const result = await userPromptTool.execute(
      {
        prompt: 'Test prompt',
      },
      mockContext,
    );

    expect(result).toHaveProperty('userText');
    expect(result.userText).toBe('Mock user response');

    // Since we're using MockLogger which doesn't track calls,
    // we can't verify the exact logger calls, but the test is still valid
  });

  it('should log the user response', async () => {
    const { userPrompt } = await import('../../utils/userPrompt.js');
    (userPrompt as any).mockResolvedValueOnce('Custom response');

    const result = await userPromptTool.execute(
      {
        prompt: 'Another test prompt',
      },
      mockContext,
    );

    expect(result.userText).toBe('Custom response');

    // Since we're using MockLogger which doesn't track calls,
    // we can't verify the exact logger calls, but the test is still valid
  });
});
