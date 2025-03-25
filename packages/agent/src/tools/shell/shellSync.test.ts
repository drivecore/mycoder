import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { shellStartTool } from './shellStart';
import { ShellStatus, ShellTracker } from './ShellTracker';

import type { ToolContext } from '../../core/types';

// Track the process 'on' handlers
let processOnHandlers: Record<string, Function> = {};

// Create a mock process
const mockProcess = {
  on: vi.fn((event, handler) => {
    processOnHandlers[event] = handler;
    return mockProcess;
  }),
  stdout: {
    on: vi.fn().mockReturnThis(),
  },
  stderr: {
    on: vi.fn().mockReturnThis(),
  },
  stdin: {
    write: vi.fn(),
    writable: true,
  },
};

// Mock child_process.spawn
vi.mock('child_process', () => ({
  spawn: vi.fn(() => mockProcess),
}));

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid'),
}));

describe('shellStartTool sync execution', () => {
  const mockLogger = {
    log: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  };

  const shellTracker = new ShellTracker('test-agent');

  // Create a mock ToolContext with all required properties
  const mockToolContext: ToolContext = {
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
    processOnHandlers = {};
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should mark a quickly completed process as COMPLETED in sync mode', async () => {
    // Start executing the command but don't await it yet
    const resultPromise = shellStartTool.execute(
      {
        command: 'echo "test"',
        description: 'Testing sync completion',
        timeout: 5000, // Use a longer timeout to ensure we're testing sync mode
      },
      mockToolContext,
    );

    // Verify the shell was registered as running
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(1);

    // Simulate the process completing successfully
    processOnHandlers['exit']?.(0, null);

    // Now await the result
    const result = await resultPromise;

    // Verify we got a sync response
    expect(result.mode).toBe('sync');

    // Verify the shell status was updated to COMPLETED
    const completedShells = shellTracker.getShells(ShellStatus.COMPLETED);
    expect(completedShells.length).toBe(1);
    expect(completedShells?.[0]?.shellId).toBe('mock-uuid');

    // Verify no shells are left in RUNNING state
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(0);
  });

  it('should mark a process that exits with non-zero code as ERROR in sync mode', async () => {
    // Start executing the command but don't await it yet
    const resultPromise = shellStartTool.execute(
      {
        command: 'some-failing-command',
        description: 'Testing sync error handling',
        timeout: 5000,
      },
      mockToolContext,
    );

    // Verify the shell was registered as running
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(1);

    // Simulate the process failing with a non-zero exit code
    processOnHandlers['exit']?.(1, null);

    // Now await the result
    const result = await resultPromise;

    // Verify we got a sync response with error
    expect(result.mode).toBe('sync');
    expect(result['exitCode']).toBe(1);

    // Verify the shell status was updated to ERROR
    const errorShells = shellTracker.getShells(ShellStatus.ERROR);
    expect(errorShells.length).toBe(1);
    expect(errorShells?.[0]?.shellId).toBe('mock-uuid');

    // Verify no shells are left in RUNNING state
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(0);
  });

  it('should mark a process with an error event as ERROR in sync mode', async () => {
    // Start executing the command but don't await it yet
    const resultPromise = shellStartTool.execute(
      {
        command: 'command-that-errors',
        description: 'Testing sync error event handling',
        timeout: 5000,
      },
      mockToolContext,
    );

    // Verify the shell was registered as running
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(1);

    // Simulate an error event
    processOnHandlers['error']?.(new Error('Test error'));

    // Now await the result
    const result = await resultPromise;

    // Verify we got a sync response with error info
    expect(result.mode).toBe('async'); // Error events always use async mode
    expect(result.error).toBe('Test error');

    // Verify the shell status was updated to ERROR
    const errorShells = shellTracker.getShells(ShellStatus.ERROR);
    expect(errorShells.length).toBe(1);
    expect(errorShells?.[0]?.shellId).toBe('mock-uuid');

    // Verify no shells are left in RUNNING state
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(0);
  });
});
