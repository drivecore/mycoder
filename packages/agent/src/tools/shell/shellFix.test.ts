import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { shellStartTool } from './shellStart';
import { ShellStatus, ShellTracker } from './ShellTracker';

import type { ToolContext } from '../../core/types';

// Create mock process
const mockProcess = {
  on: vi.fn(),
  stdout: { on: vi.fn() },
  stderr: { on: vi.fn() },
};

// Mock child_process.spawn
vi.mock('child_process', () => ({
  spawn: vi.fn().mockReturnValue(mockProcess),
}));

/**
 * This test verifies the fix for the ShellTracker bug where short-lived commands
 * are incorrectly reported as still running.
 */
describe('shellStart fix verification', () => {
  // Create a real ShellTracker
  const shellTracker = new ShellTracker('test-agent');

  // Mock the shellTracker methods to track calls
  const originalRegisterShell = shellTracker.registerShell;
  const originalUpdateShellStatus = shellTracker.updateShellStatus;

  // Create mock logger
  const mockLogger = {
    log: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  };

  // Create mock context
  const mockContext: ToolContext = {
    logger: mockLogger as any,
    workingDirectory: '/test',
    headless: false,
    userSession: false,
    tokenTracker: { trackTokens: vi.fn() } as any,
    githubMode: false,
    provider: 'anthropic',
    maxTokens: 4000,
    temperature: 0,
    agentTracker: { registerAgent: vi.fn() } as any,
    shellTracker: shellTracker as any,
    browserTracker: { registerSession: vi.fn() } as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    shellTracker['shells'] = new Map();
    shellTracker.processStates.clear();

    // Spy on methods
    shellTracker.registerShell = vi.fn().mockImplementation((cmd) => {
      const id = originalRegisterShell.call(shellTracker, cmd);
      return id;
    });

    shellTracker.updateShellStatus = vi
      .fn()
      .mockImplementation((id, status, metadata) => {
        return originalUpdateShellStatus.call(
          shellTracker,
          id,
          status,
          metadata,
        );
      });

    // Set up event handler capture
    mockProcess.on.mockImplementation((event, handler) => {
      // Store the handler for later triggering
      mockProcess[event] = handler;
      return mockProcess;
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should use the shellId returned from registerShell when updating status', async () => {
    // Start a shell command
    const promise = shellStartTool.execute(
      { command: 'test command', description: 'Testing', timeout: 5000 },
      mockContext,
    );

    // Verify registerShell was called
    expect(shellTracker.registerShell).toHaveBeenCalledWith('test command');

    // Get the shellId that was returned by registerShell
    const shellId = (shellTracker.registerShell as any).mock.results[0].value;

    // Simulate process completion
    mockProcess['exit']?.(0, null);

    // Wait for the promise to resolve
    await promise;

    // Verify updateShellStatus was called with the correct shellId
    expect(shellTracker.updateShellStatus).toHaveBeenCalledWith(
      shellId,
      ShellStatus.COMPLETED,
      expect.objectContaining({ exitCode: 0 }),
    );
  });
});
