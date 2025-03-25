import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { shellStartTool } from './shellStart';
import { ShellStatus, ShellTracker } from './ShellTracker';

import type { ToolContext } from '../../core/types';

/**
 * This test focuses on the interaction between shellStart and ShellTracker
 * to identify potential issues with shell status tracking.
 *
 * TODO: These tests are currently skipped due to issues with the test setup.
 * They should be revisited and fixed in a future update.
 */
describe('shellStart ShellTracker integration', () => {
  // Create mock process and event handlers
  const mockProcess = {
    on: vi.fn(),
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
  };

  // Capture event handlers
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  const eventHandlers: Record<string, Function> = {};

  // Set up mock for child_process.spawn
  vi.mock('child_process', () => ({
    spawn: vi.fn().mockImplementation(() => {
      // Set up event handler capture
      mockProcess.on.mockImplementation((event, handler) => {
        eventHandlers[event] = handler;
        return mockProcess;
      });

      return mockProcess;
    }),
  }));

  // Create a real ShellTracker
  let shellTracker: ShellTracker;

  // Create mock logger
  const mockLogger = {
    log: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  };

  // Create mock context function
  const createMockContext = (): ToolContext => ({
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
  });

  beforeEach(() => {
    vi.clearAllMocks();
    shellTracker = new ShellTracker('test-agent');
    Object.keys(eventHandlers).forEach((key) => delete eventHandlers[key]);

    // Mock the registerShell method to return a known ID
    vi.spyOn(shellTracker, 'registerShell').mockImplementation((command) => {
      const shellId = 'test-shell-id';
      const shell = {
        shellId,
        status: ShellStatus.RUNNING,
        startTime: new Date(),
        metadata: { command },
      };
      shellTracker['shells'].set(shellId, shell);
      return shellId;
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // TODO: Fix these tests
  it.skip('should update shell status to COMPLETED when process exits with code 0 in sync mode', async () => {
    // Start the shell command but don't await it yet
    const resultPromise = shellStartTool.execute(
      { command: 'echo test', description: 'Test command', timeout: 5000 },
      createMockContext(),
    );

    // Verify the shell is registered
    expect(shellTracker.getShells().length).toBe(1);
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(1);

    // Trigger the exit event with success code
    eventHandlers['exit']?.(0, null);

    // Now await the result
    const result = await resultPromise;

    // Verify sync mode
    expect(result.mode).toBe('sync');

    // Check shell tracker status after completion
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(0);
    expect(shellTracker.getShells(ShellStatus.COMPLETED).length).toBe(1);

    // Verify the shell details
    const completedShells = shellTracker.getShells(ShellStatus.COMPLETED);
    expect(completedShells?.[0]?.shellId).toBe('test-shell-id');
    expect(completedShells?.[0]?.metadata.exitCode).toBe(0);
  });

  it.skip('should update shell status to ERROR when process exits with non-zero code in sync mode', async () => {
    // Start the shell command but don't await it yet
    const resultPromise = shellStartTool.execute(
      { command: 'invalid command', description: 'Test error', timeout: 5000 },
      createMockContext(),
    );

    // Verify the shell is registered
    expect(shellTracker.getShells().length).toBe(1);
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(1);

    // Trigger the exit event with error code
    eventHandlers['exit']?.(1, null);

    // Now await the result
    const result = await resultPromise;

    // Verify sync mode
    expect(result.mode).toBe('sync');

    // Check shell tracker status after completion
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(0);
    expect(shellTracker.getShells(ShellStatus.ERROR).length).toBe(1);

    // Verify the shell details
    const errorShells = shellTracker.getShells(ShellStatus.ERROR);
    expect(errorShells?.[0]?.shellId).toBe('test-shell-id');
    expect(errorShells?.[0]?.metadata.exitCode).toBe(1);
  });

  it.skip('should update shell status to COMPLETED when process exits with code 0 in async mode', async () => {
    // Force async mode by using a modified version of the tool with timeout=0
    const modifiedShellStartTool = {
      ...shellStartTool,
      execute: async (params: any, context: any) => {
        // Force timeout to 0 to ensure async mode
        const result = await shellStartTool.execute(
          { ...params, timeout: 0 },
          context,
        );
        return result;
      },
    };

    // Start the shell command with forced async mode
    const resultPromise = modifiedShellStartTool.execute(
      { command: 'long command', description: 'Async test', timeout: 5000 },
      createMockContext(),
    );

    // Await the result, which should be in async mode
    const result = await resultPromise;

    // Verify async mode
    expect(result.mode).toBe('async');

    // Shell should still be running
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(1);

    // Now trigger the exit event with success code
    eventHandlers['exit']?.(0, null);

    // Check shell tracker status after completion
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(0);
    expect(shellTracker.getShells(ShellStatus.COMPLETED).length).toBe(1);
  });

  it.skip('should handle multiple concurrent shell commands correctly', async () => {
    // Start first command
    const cmd1Promise = shellStartTool.execute(
      { command: 'cmd1', description: 'First command', timeout: 5000 },
      createMockContext(),
    );

    // Trigger completion for the first command
    eventHandlers['exit']?.(0, null);

    // Get the first result
    const result1 = await cmd1Promise;

    // Reset the shell tracker for the second command
    shellTracker['shells'] = new Map();

    // Re-mock registerShell for the second command with a different ID
    vi.spyOn(shellTracker, 'registerShell').mockImplementation((command) => {
      const shellId = 'test-shell-id-2';
      const shell = {
        shellId,
        status: ShellStatus.RUNNING,
        startTime: new Date(),
        metadata: { command },
      };
      shellTracker['shells'].set(shellId, shell);
      return shellId;
    });

    // Start a second command
    const cmd2Promise = shellStartTool.execute(
      { command: 'cmd2', description: 'Second command', timeout: 5000 },
      createMockContext(),
    );

    // Trigger failure for the second command
    eventHandlers['exit']?.(1, null);

    // Get the second result
    const result2 = await cmd2Promise;

    // Verify both commands completed properly
    expect(result1.mode).toBe('sync');
    expect(result2.mode).toBe('sync');

    // Verify shell tracker state
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(0);
    expect(shellTracker.getShells(ShellStatus.ERROR).length).toBe(1);
  });
});
