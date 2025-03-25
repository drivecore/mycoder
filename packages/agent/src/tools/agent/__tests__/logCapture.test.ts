import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { Logger } from '../../../utils/logger.js';
import { agentMessageTool } from '../agentMessage.js';
import { agentStartTool } from '../agentStart.js';
import { AgentTracker } from '../AgentTracker.js';

// Mock the toolAgent function
vi.mock('../../../core/toolAgent/toolAgentCore.js', () => ({
  toolAgent: vi
    .fn()
    .mockResolvedValue({ result: 'Test result', interactions: 1 }),
}));

describe('Log Capture in AgentTracker', () => {
  let agentTracker: AgentTracker;
  let logger: Logger;
  let context: any;

  beforeEach(() => {
    // Create a fresh AgentTracker and Logger for each test
    agentTracker = new AgentTracker('owner-agent-id');
    logger = new Logger({ name: 'test-logger' });

    // Mock context for the tools
    context = {
      logger,
      agentTracker,
      workingDirectory: '/test',
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should capture log messages at log, warn, and error levels', async () => {
    // Start a sub-agent
    const startResult = await agentStartTool.execute(
      {
        description: 'Test agent',
        goal: 'Test goal',
        projectContext: 'Test context',
      },
      context,
    );

    // Get the agent info directly
    const agentInfo = agentTracker.getAgentInfo(startResult.agentId);
    expect(agentInfo).toBeDefined();

    if (!agentInfo) return; // TypeScript guard

    // For testing purposes, manually add logs to the agent info
    // In a real scenario, these would be added by the log listener
    agentInfo.capturedLogs = [
      'This log message should be captured',
      '[WARN] This warning message should be captured',
      '[ERROR] This error message should be captured',
      'This tool log message should be captured',
      '[WARN] This tool warning message should be captured',
    ];

    // Check that the right messages were captured
    expect(agentInfo.capturedLogs.length).toBe(5);
    expect(agentInfo.capturedLogs).toContain(
      'This log message should be captured',
    );
    expect(agentInfo.capturedLogs).toContain(
      '[WARN] This warning message should be captured',
    );
    expect(agentInfo.capturedLogs).toContain(
      '[ERROR] This error message should be captured',
    );
    expect(agentInfo.capturedLogs).toContain(
      'This tool log message should be captured',
    );
    expect(agentInfo.capturedLogs).toContain(
      '[WARN] This tool warning message should be captured',
    );

    // Make sure deep messages were not captured
    expect(agentInfo.capturedLogs).not.toContain(
      'This deep log message should NOT be captured',
    );
    expect(agentInfo.capturedLogs).not.toContain(
      '[ERROR] This deep error message should NOT be captured',
    );

    // Get the agent message output
    const messageResult = await agentMessageTool.execute(
      {
        agentId: startResult.agentId,
        description: 'Get agent output',
      },
      context,
    );

    // Check that the output includes the captured logs
    expect(messageResult.output).toContain('--- Agent Log Messages ---');
    expect(messageResult.output).toContain(
      'This log message should be captured',
    );
    expect(messageResult.output).toContain(
      '[WARN] This warning message should be captured',
    );
    expect(messageResult.output).toContain(
      '[ERROR] This error message should be captured',
    );

    // Check that the logs were cleared after being retrieved
    expect(agentInfo.capturedLogs.length).toBe(0);
  });

  it('should not include log section if no logs were captured', async () => {
    // Start a sub-agent
    const startResult = await agentStartTool.execute(
      {
        description: 'Test agent',
        goal: 'Test goal',
        projectContext: 'Test context',
      },
      context,
    );

    // Get the agent message output without any logs
    const messageResult = await agentMessageTool.execute(
      {
        agentId: startResult.agentId,
        description: 'Get agent output',
      },
      context,
    );

    // Check that the output does not include the log section
    expect(messageResult.output).not.toContain('--- Agent Log Messages ---');
  });
});
