import { describe, it, expect } from 'vitest';

import { TokenTracker } from '../core/tokens.js';
import { ToolContext } from '../core/types.js';
import { MockLogger } from '../utils/mockLogger.js';

import { AgentTracker } from './agent/AgentTracker.js';
import { getTools } from './getTools.js';
import { SessionTracker } from './session/SessionTracker.js';
import { ShellTracker } from './shell/ShellTracker.js';

// Mock context
export const getMockToolContext = (): ToolContext => ({
  logger: new MockLogger(),
  tokenTracker: new TokenTracker(),
  workingDirectory: '.',
  headless: true,
  userSession: false,
  githubMode: true,
  provider: 'anthropic',
  model: 'claude-3-7-sonnet-20250219',
  maxTokens: 4096,
  temperature: 0.7,
  agentTracker: new AgentTracker('test'),
  shellTracker: new ShellTracker('test'),
  browserTracker: new SessionTracker('test'),
});

describe('getTools', () => {
  it('should return a successful result with tools', () => {
    const tools = getTools();
    expect(tools).toBeInstanceOf(Array);
    expect(tools.length).toBeGreaterThanOrEqual(5); // At least core tools
  });

  it('should include core tools', () => {
    const tools = getTools();
    const toolNames = tools.map((tool) => tool.name);

    // Check for essential tools
    expect(toolNames.length).greaterThan(0);
  });

  it('should have unique tool names', () => {
    const tools = getTools();
    const toolNames = tools.map((tool) => tool.name);
    const uniqueNames = new Set(toolNames);

    expect(toolNames).toHaveLength(uniqueNames.size);
  });

  it('should have valid schema for each tool', () => {
    const tools = getTools();

    for (const tool of tools) {
      expect(tool).toEqual(
        expect.objectContaining({
          name: expect.any(String),
          description: expect.any(String),
          parameters: expect.any(Object),
        }),
      );
    }
  });

  it('should have executable functions', () => {
    const tools = getTools();

    for (const tool of tools) {
      expect(tool.execute).toBeTypeOf('function');
    }
  });
});
