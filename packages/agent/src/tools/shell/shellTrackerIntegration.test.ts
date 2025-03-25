import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { listShellsTool } from './listShells';
import { shellStartTool } from './shellStart';
import { ShellStatus, ShellTracker } from './ShellTracker';

import type { ToolContext } from '../../core/types';

/**
 * Create a more realistic test that simulates running multiple commands
 * and verifies the shell tracker's state
 *
 * TODO: These tests are currently skipped due to issues with the test setup.
 * They should be revisited and fixed in a future update.
 */
describe('ShellTracker integration', () => {
  // Create a real ShellTracker instance
  let shellTracker: ShellTracker;

  // Store event handlers for each process
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  const eventHandlers: Record<string, Function> = {};

  // Mock process
  const mockProcess = {
    on: vi.fn(),
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
  };

  // Mock child_process
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
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // TODO: Fix these tests
  it.skip('should correctly track multiple shell commands with different completion times', async () => {
    // Setup shellTracker to track multiple commands
    let shellIdCounter = 0;
    vi.spyOn(shellTracker, 'registerShell').mockImplementation((command) => {
      const shellId = `shell-${++shellIdCounter}`;
      const shell = {
        shellId,
        status: ShellStatus.RUNNING,
        startTime: new Date(),
        metadata: { command },
      };
      shellTracker['shells'].set(shellId, shell);
      return shellId;
    });

    // Start first command
    const cmd1Promise = shellStartTool.execute(
      { command: 'echo hello', description: 'Command 1', timeout: 0 },
      createMockContext(),
    );

    // Await first result (in async mode)
    const result1 = await cmd1Promise;
    expect(result1.mode).toBe('async');

    // Start second command
    const cmd2Promise = shellStartTool.execute(
      { command: 'ls -la', description: 'Command 2', timeout: 0 },
      createMockContext(),
    );

    // Await second result (in async mode)
    const result2 = await cmd2Promise;
    expect(result2.mode).toBe('async');

    // Start third command
    const cmd3Promise = shellStartTool.execute(
      { command: 'find . -name "*.js"', description: 'Command 3', timeout: 0 },
      createMockContext(),
    );

    // Await third result (in async mode)
    const result3 = await cmd3Promise;
    expect(result3.mode).toBe('async');

    // Check that all 3 shells are registered as running
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(3);

    // Complete the first command with successful exit
    eventHandlers['exit']?.(0, null);

    // Update the shell status manually since we're mocking the event handlers
    shellTracker.updateShellStatus('shell-1', ShellStatus.COMPLETED, {
      exitCode: 0,
    });

    // Complete the second command with an error
    eventHandlers['exit']?.(1, null);

    // Update the shell status manually
    shellTracker.updateShellStatus('shell-2', ShellStatus.ERROR, {
      exitCode: 1,
    });

    // Check shell statuses before the third command completes
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(1);
    expect(shellTracker.getShells(ShellStatus.COMPLETED).length).toBe(1);
    expect(shellTracker.getShells(ShellStatus.ERROR).length).toBe(1);

    // Complete the third command with success
    eventHandlers['exit']?.(0, null);

    // Update the shell status manually
    shellTracker.updateShellStatus('shell-3', ShellStatus.COMPLETED, {
      exitCode: 0,
    });

    // Check final shell statuses
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(0);
    expect(shellTracker.getShells(ShellStatus.COMPLETED).length).toBe(2);
    expect(shellTracker.getShells(ShellStatus.ERROR).length).toBe(1);

    // Verify listShells tool correctly reports the statuses
    const listResult = await listShellsTool.execute({}, createMockContext());
    expect(listResult.shells.length).toBe(3);
    expect(
      listResult.shells.filter((s) => s.status === ShellStatus.RUNNING).length,
    ).toBe(0);
    expect(
      listResult.shells.filter((s) => s.status === ShellStatus.COMPLETED)
        .length,
    ).toBe(2);
    expect(
      listResult.shells.filter((s) => s.status === ShellStatus.ERROR).length,
    ).toBe(1);
  });

  it.skip('should handle commands that transition from sync to async mode', async () => {
    // Setup shellTracker to track the command
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

    // Start a command with forced async mode
    const cmdPromise = modifiedShellStartTool.execute(
      {
        command: 'long-running-command',
        description: 'Long command',
        timeout: 100,
      },
      createMockContext(),
    );

    // Check that the shell is registered as running
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(1);

    // Get the result (which will be in async mode)
    const result = await cmdPromise;

    // Verify it went into async mode
    expect(result.mode).toBe('async');

    // Shell should still be marked as running
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(1);

    // Now complete the command
    eventHandlers['exit']?.(0, null);

    // Update the shell status manually
    shellTracker.updateShellStatus('test-shell-id', ShellStatus.COMPLETED, {
      exitCode: 0,
    });

    // Verify the shell is now marked as completed
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(0);
    expect(shellTracker.getShells(ShellStatus.COMPLETED).length).toBe(1);
  });
});
