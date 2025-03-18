import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// Import mocked modules
import { BrowserManager } from '../tools/browser/BrowserManager.js';
import { agentStates } from '../tools/interaction/agentStart.js';
import { agentTracker } from '../tools/interaction/agentTracker.js';
import { shellTracker } from '../tools/system/ShellTracker.js';

import { BackgroundTools, BackgroundToolStatus } from './backgroundTools';

// Import the ChildProcess type for mocking
import type { ChildProcess } from 'child_process';

// Define types for our mocks that match the actual types
type MockProcessState = {
  process: ChildProcess & { kill: ReturnType<typeof vi.fn> };
  state: {
    completed: boolean;
    signaled: boolean;
    exitCode: number | null;
  };
  command: string;
  stdout: string[];
  stderr: string[];
  showStdIn: boolean;
  showStdout: boolean;
};

// Mock dependencies
vi.mock('../tools/browser/BrowserManager.js', () => {
  return {
    BrowserManager: class MockBrowserManager {
      closeSession = vi.fn().mockResolvedValue(undefined);
    },
  };
});

vi.mock('../tools/system/ShellTracker.js', () => {
  return {
    shellTracker: {
      processStates: new Map<string, MockProcessState>(),
      cleanupAllShells: vi.fn().mockResolvedValue(undefined),
    },
  };
});

vi.mock('../tools/interaction/agentTracker.js', () => {
  return {
    agentTracker: {
      terminateAgent: vi.fn().mockResolvedValue(undefined),
      getAgentState: vi.fn().mockImplementation((id: string) => {
        return {
          id,
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
      }),
    },
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
      stdin: null,
      stdout: null,
      stderr: null,
      stdio: null,
    } as unknown as ChildProcess & { kill: ReturnType<typeof vi.fn> };

    const mockProcessState: MockProcessState = {
      process: mockProcess,
      state: {
        completed: false,
        signaled: false,
        exitCode: null,
      },
      command: 'test command',
      stdout: [],
      stderr: [],
      showStdIn: false,
      showStdout: false,
    };

    shellTracker.processStates.clear();
    shellTracker.processStates.set('shell-1', mockProcessState as any);

    // Reset the agentTracker mock
    vi.mocked(agentTracker.terminateAgent).mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();

    // Clear global browser manager
    (
      globalThis as unknown as { __BROWSER_MANAGER__?: BrowserManager }
    ).__BROWSER_MANAGER__ = undefined;

    // Clear mock states
    shellTracker.processStates.clear();
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
    // Run cleanup
    await backgroundTools.cleanup();

    // Check that shellTracker.cleanupAllShells was called
    expect(shellTracker.cleanupAllShells).toHaveBeenCalled();
  });

  it('should clean up sub-agents', async () => {
    // Register an agent tool
    const agentId = backgroundTools.registerAgent('Test goal');

    // Run cleanup
    await backgroundTools.cleanup();

    // Check that terminateAgent was called with the agent ID
    expect(agentTracker.terminateAgent).toHaveBeenCalledWith(agentId);

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
