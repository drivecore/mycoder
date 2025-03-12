import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// Import mocked modules
import { BrowserManager } from '../tools/browser/BrowserManager.js';
import { agentStates } from '../tools/interaction/agentStart.js';
import { processStates } from '../tools/system/shellStart.js';

import { BackgroundTools, BackgroundToolStatus } from './backgroundTools';
import { Tool } from './types';

// Define types for our mocks that match the actual types
type MockProcessState = {
  process: { kill: ReturnType<typeof vi.fn> };
  state: { completed: boolean };
  command?: string;
  stdout?: string[];
  stderr?: string[];
  showStdIn?: boolean;
  showStdout?: boolean;
};

type MockAgentState = {
  aborted: boolean;
  completed: boolean;
  context: {
    backgroundTools: {
      cleanup: ReturnType<typeof vi.fn>;
    };
  };
  goal?: string;
  prompt?: string;
  output?: string;
  workingDirectory?: string;
  tools?: Tool[];
};

// Mock dependencies
vi.mock('../tools/browser/BrowserManager.js', () => {
  return {
    BrowserManager: class MockBrowserManager {
      closeSession = vi.fn().mockResolvedValue(undefined);
    },
  };
});

vi.mock('../tools/system/shellStart.js', () => {
  return {
    processStates: new Map<string, MockProcessState>(),
  };
});

vi.mock('../tools/interaction/agentStart.js', () => {
  return {
    agentStates: new Map<string, MockAgentState>(),
  };
});

describe('BackgroundTools cleanup', () => {
  let backgroundTools: BackgroundTools;

  // Setup mocks for globalThis and process states
  beforeEach(() => {
    backgroundTools = new BackgroundTools('test-agent');

    // Reset mocks
    vi.resetAllMocks();

    // Setup global browser manager
    (
      globalThis as unknown as { __BROWSER_MANAGER__: BrowserManager }
    ).__BROWSER_MANAGER__ = {
      closeSession: vi.fn().mockResolvedValue(undefined),
    } as unknown as BrowserManager;

    // Setup mock process states
    const mockProcess = {
      kill: vi.fn(),
    };

    const mockProcessState: MockProcessState = {
      process: mockProcess,
      state: { completed: false },
      command: 'test command',
      stdout: [],
      stderr: [],
      showStdIn: false,
      showStdout: false,
    };

    processStates.clear();
    processStates.set('shell-1', mockProcessState as any);

    // Setup mock agent states
    const mockAgentState: MockAgentState = {
      aborted: false,
      completed: false,
      context: {
        backgroundTools: {
          cleanup: vi.fn().mockResolvedValue(undefined),
        },
      },
      goal: 'test goal',
      prompt: 'test prompt',
      output: '',
      workingDirectory: '/test',
      tools: [],
    };

    agentStates.clear();
    agentStates.set('agent-1', mockAgentState as any);
  });

  afterEach(() => {
    vi.resetAllMocks();

    // Clear global browser manager
    (
      globalThis as unknown as { __BROWSER_MANAGER__?: BrowserManager }
    ).__BROWSER_MANAGER__ = undefined;

    // Clear mock states
    processStates.clear();
    agentStates.clear();
  });

  it('should clean up browser sessions', async () => {
    // Register a browser tool
    const browserId = backgroundTools.registerBrowser('https://example.com');

    // Run cleanup
    await backgroundTools.cleanup();

    // Check that closeSession was called
    expect(
      (globalThis as unknown as { __BROWSER_MANAGER__: BrowserManager })
        .__BROWSER_MANAGER__.closeSession,
    ).toHaveBeenCalledWith(browserId);

    // Check that tool status was updated
    const tool = backgroundTools.getToolById(browserId);
    expect(tool?.status).toBe(BackgroundToolStatus.COMPLETED);
  });

  it('should clean up shell processes', async () => {
    // Register a shell tool
    const shellId = backgroundTools.registerShell('echo "test"');

    // Get mock process state
    const mockProcessState = processStates.get('shell-1');

    // Set the shell ID to match
    processStates.set(shellId, processStates.get('shell-1') as any);

    // Run cleanup
    await backgroundTools.cleanup();

    // Check that kill was called
    expect(mockProcessState?.process.kill).toHaveBeenCalledWith('SIGTERM');

    // Check that tool status was updated
    const tool = backgroundTools.getToolById(shellId);
    expect(tool?.status).toBe(BackgroundToolStatus.COMPLETED);
  });

  it('should clean up sub-agents', async () => {
    // Register an agent tool
    const agentId = backgroundTools.registerAgent('Test goal');

    // Get mock agent state
    const mockAgentState = agentStates.get('agent-1');

    // Set the agent ID to match
    agentStates.set(agentId, agentStates.get('agent-1') as any);

    // Run cleanup
    await backgroundTools.cleanup();

    // Check that agent was marked as aborted
    expect(mockAgentState?.aborted).toBe(true);
    expect(mockAgentState?.completed).toBe(true);

    // Check that cleanup was called on the agent's background tools
    expect(mockAgentState?.context.backgroundTools.cleanup).toHaveBeenCalled();

    // Check that tool status was updated
    const tool = backgroundTools.getToolById(agentId);
    expect(tool?.status).toBe(BackgroundToolStatus.TERMINATED);
  });

  it('should handle errors during cleanup', async () => {
    // Register a browser tool
    const browserId = backgroundTools.registerBrowser('https://example.com');

    // Make closeSession throw an error
    (
      (globalThis as unknown as { __BROWSER_MANAGER__: BrowserManager })
        .__BROWSER_MANAGER__.closeSession as ReturnType<typeof vi.fn>
    ).mockRejectedValue(new Error('Test error'));

    // Run cleanup
    await backgroundTools.cleanup();

    // Check that tool status was updated to ERROR
    const tool = backgroundTools.getToolById(browserId);
    expect(tool?.status).toBe(BackgroundToolStatus.ERROR);
    expect(tool?.metadata.error).toBe('Test error');
  });

  it('should only clean up running tools', async () => {
    // Register a browser tool and mark it as completed
    const browserId = backgroundTools.registerBrowser('https://example.com');
    backgroundTools.updateToolStatus(browserId, BackgroundToolStatus.COMPLETED);

    // Run cleanup
    await backgroundTools.cleanup();

    // Check that closeSession was not called
    expect(
      (globalThis as unknown as { __BROWSER_MANAGER__: BrowserManager })
        .__BROWSER_MANAGER__.closeSession,
    ).not.toHaveBeenCalled();
  });
});
