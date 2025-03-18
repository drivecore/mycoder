import { describe, expect, it, vi } from 'vitest';

import { TokenTracker } from '../../core/tokens.js';
import { ToolContext } from '../../core/types.js';
import { MockLogger } from '../../utils/mockLogger.js';
import { BrowserTracker } from '../browser/browserTracker.js';
import { ShellTracker } from '../system/ShellTracker.js';

import { agentMessageTool } from './agentMessage.js';
import { agentStartTool, agentStates } from './agentStart.js';
import { AgentTracker } from './agentTracker.js';

// Mock the toolAgent function
vi.mock('../../core/toolAgent/toolAgentCore.js', () => ({
  toolAgent: vi.fn().mockResolvedValue({
    result: 'Mock agent result',
    interactions: 1,
  }),
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
  agentTracker: new AgentTracker('test'),
  shellTracker: new ShellTracker('test'),
  browserTracker: new BrowserTracker('test'),
};

describe('Agent Tools', () => {
  describe('agentStartTool', () => {
    it('should start an agent and return an instance ID', async () => {
      const result = await agentStartTool.execute(
        {
          description: 'Test agent',
          goal: 'Test the agent tools',
          projectContext: 'Testing environment',
        },
        mockContext,
      );

      expect(result).toHaveProperty('instanceId');
      expect(result).toHaveProperty('status');
      expect(result.status).toBe('Agent started successfully');

      // Verify the agent state was created
      expect(agentStates.has(result.instanceId)).toBe(true);

      const state = agentStates.get(result.instanceId);
      expect(state).toHaveProperty('goal', 'Test the agent tools');
      expect(state).toHaveProperty('prompt');
      expect(state).toHaveProperty('completed', false);
      expect(state).toHaveProperty('aborted', false);
    });
  });

  describe('agentMessageTool', () => {
    it('should retrieve agent state', async () => {
      // First start an agent
      const startResult = await agentStartTool.execute(
        {
          description: 'Test agent for message',
          goal: 'Test the agent message tool',
          projectContext: 'Testing environment',
        },
        mockContext,
      );

      // Then get its state
      const messageResult = await agentMessageTool.execute(
        {
          instanceId: startResult.instanceId,
          description: 'Checking agent status',
        },
        mockContext,
      );

      expect(messageResult).toHaveProperty('output');
      expect(messageResult).toHaveProperty('completed', false);
    });

    it('should handle non-existent agent IDs', async () => {
      const result = await agentMessageTool.execute(
        {
          instanceId: 'non-existent-id',
          description: 'Checking non-existent agent',
        },
        mockContext,
      );

      expect(result).toHaveProperty('error');
      expect(result.error).toContain('No sub-agent found with ID');
    });

    it('should terminate an agent when requested', async () => {
      // First start an agent
      const startResult = await agentStartTool.execute(
        {
          description: 'Test agent for termination',
          goal: 'Test agent termination',
          projectContext: 'Testing environment',
        },
        mockContext,
      );

      // Then terminate it
      const messageResult = await agentMessageTool.execute(
        {
          instanceId: startResult.instanceId,
          terminate: true,
          description: 'Terminating agent',
        },
        mockContext,
      );

      expect(messageResult).toHaveProperty('terminated', true);
      expect(messageResult).toHaveProperty('completed', true);

      // Verify the agent state was updated
      const state = agentStates.get(startResult.instanceId);
      expect(state).toHaveProperty('aborted', true);
      expect(state).toHaveProperty('completed', true);
    });
  });
});
