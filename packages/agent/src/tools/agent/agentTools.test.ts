import { describe, expect, it, vi } from 'vitest';

import { TokenTracker } from '../../core/tokens.js';
import { ToolContext } from '../../core/types.js';
import { MockLogger } from '../../utils/mockLogger.js';
import { SessionTracker } from '../session/SessionTracker.js';
import { ShellTracker } from '../shell/ShellTracker.js';

import { agentMessageTool } from './agentMessage.js';
import { agentStartTool, agentStates } from './agentStart.js';
import { AgentTracker } from './AgentTracker.js';

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
  githubMode: true,
  provider: 'anthropic',
  model: 'claude-3-7-sonnet-20250219',
  maxTokens: 4096,
  temperature: 0.7,
  agentTracker: new AgentTracker('test'),
  shellTracker: new ShellTracker('test'),
  browserTracker: new SessionTracker('test'),
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

      expect(result).toHaveProperty('agentId');
      expect(result).toHaveProperty('status');
      expect(result.status).toBe('Agent started successfully');

      // Verify the agent was created in the tracker
      const agent = mockContext.agentTracker.getAgent(result.agentId);
      expect(agent).toBeDefined();
      expect(agent).toHaveProperty('goal', 'Test the agent tools');
      expect(agent).toHaveProperty('completed', false);
      expect(agent).toHaveProperty('aborted', false);

      // Verify it was also added to legacy agentStates for backward compatibility
      expect(agentStates.has(result.agentId)).toBe(true);
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
          agentId: startResult.agentId,
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
          agentId: 'non-existent-id',
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
          agentId: startResult.agentId,
          terminate: true,
          description: 'Terminating agent',
        },
        mockContext,
      );

      expect(messageResult).toHaveProperty('terminated', true);
      expect(messageResult).toHaveProperty('completed', true);

      // Verify the agent was updated
      const agent = mockContext.agentTracker.getAgent(startResult.agentId);
      expect(agent).toHaveProperty('aborted', true);
      expect(agent).toHaveProperty('completed', true);
    });
  });
});
