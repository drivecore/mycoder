/**
 * Tests for the status updates mechanism
 */
import { describe, expect, it, vi } from 'vitest';

import { TokenTracker } from '../../tokens.js';
import { ToolContext } from '../../types.js';
import { AgentStatus } from '../../../tools/agent/AgentTracker.js';
import { ShellStatus } from '../../../tools/shell/ShellTracker.js';
import { SessionStatus } from '../../../tools/session/SessionTracker.js';
import { generateStatusUpdate } from '../statusUpdates.js';

describe('Status Updates', () => {
  it('should generate a status update with correct token usage information', () => {
    // Setup
    const totalTokens = 50000;
    const maxTokens = 100000;
    const tokenTracker = new TokenTracker('test');
    
    // Mock the context
    const context = {
      agentTracker: {
        getAgents: vi.fn().mockReturnValue([]),
      },
      shellTracker: {
        getShells: vi.fn().mockReturnValue([]),
      },
      browserTracker: {
        getSessionsByStatus: vi.fn().mockReturnValue([]),
      },
    } as unknown as ToolContext;
    
    // Execute
    const statusMessage = generateStatusUpdate(totalTokens, maxTokens, tokenTracker, context);
    
    // Verify
    expect(statusMessage.role).toBe('system');
    expect(statusMessage.content).toContain('--- STATUS UPDATE ---');
    expect(statusMessage.content).toContain('Token Usage: 50,000/100,000 (50%)');
    expect(statusMessage.content).toContain('Active Sub-Agents: 0');
    expect(statusMessage.content).toContain('Active Shell Processes: 0');
    expect(statusMessage.content).toContain('Active Browser Sessions: 0');
    expect(statusMessage.content).toContain('compactHistory tool');
    expect(statusMessage.content).toContain('If token usage gets high (>50%)');
    expect(statusMessage.content).not.toContain('Your token usage is high');  // Not high enough
  });
  
  it('should include active agents, shells, and sessions', () => {
    // Setup
    const totalTokens = 70000;
    const maxTokens = 100000;
    const tokenTracker = new TokenTracker('test');
    
    // Mock the context with active agents, shells, and sessions
    const context = {
      agentTracker: {
        getAgents: vi.fn().mockReturnValue([
          { id: 'agent1', goal: 'Task 1', status: AgentStatus.RUNNING },
          { id: 'agent2', goal: 'Task 2', status: AgentStatus.RUNNING },
        ]),
      },
      shellTracker: {
        getShells: vi.fn().mockReturnValue([
          { 
            id: 'shell1', 
            status: ShellStatus.RUNNING, 
            metadata: { command: 'npm test' } 
          },
        ]),
      },
      browserTracker: {
        getSessionsByStatus: vi.fn().mockReturnValue([
          { 
            id: 'session1', 
            status: SessionStatus.RUNNING, 
            metadata: { url: 'https://example.com' } 
          },
        ]),
      },
    } as unknown as ToolContext;
    
    // Execute
    const statusMessage = generateStatusUpdate(totalTokens, maxTokens, tokenTracker, context);
    
    // Verify
    expect(statusMessage.content).toContain('Token Usage: 70,000/100,000 (70%)');
    expect(statusMessage.content).toContain('Your token usage is high (70%)');
    expect(statusMessage.content).toContain('recommended to use');
    expect(statusMessage.content).toContain('Active Sub-Agents: 2');
    expect(statusMessage.content).toContain('- agent1: Task 1');
    expect(statusMessage.content).toContain('- agent2: Task 2');
    expect(statusMessage.content).toContain('Active Shell Processes: 1');
    expect(statusMessage.content).toContain('- shell1: npm test');
    expect(statusMessage.content).toContain('Active Browser Sessions: 1');
    expect(statusMessage.content).toContain('- session1: https://example.com');
  });
});