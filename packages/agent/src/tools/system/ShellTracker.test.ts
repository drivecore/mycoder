import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ShellStatus, shellTracker } from './ShellTracker.js';

// Mock uuid to return predictable IDs for testing
vi.mock('uuid', () => ({
  v4: vi
    .fn()
    .mockReturnValueOnce('test-id-1')
    .mockReturnValueOnce('test-id-2')
    .mockReturnValueOnce('test-id-3'),
}));

describe('ShellTracker', () => {
  beforeEach(() => {
    // Clear all registered shells before each test
    shellTracker['shells'] = new Map();
    shellTracker.processStates.clear();
  });

  it('should register a shell process', () => {
    const id = shellTracker.registerShell('ls -la');

    expect(id).toBe('test-id-1');

    const shell = shellTracker.getShellById(id);
    expect(shell).toBeDefined();
    if (shell) {
      expect(shell.status).toBe(ShellStatus.RUNNING);
      expect(shell.metadata.command).toBe('ls -la');
    }
  });

  it('should update shell status', () => {
    const id = shellTracker.registerShell('sleep 10');

    const updated = shellTracker.updateShellStatus(id, ShellStatus.COMPLETED, {
      exitCode: 0,
    });

    expect(updated).toBe(true);

    const shell = shellTracker.getShellById(id);
    expect(shell).toBeDefined();
    if (shell) {
      expect(shell.status).toBe(ShellStatus.COMPLETED);
      expect(shell.endTime).toBeDefined();
      expect(shell.metadata.exitCode).toBe(0);
    }
  });

  it('should return false when updating non-existent shell', () => {
    const updated = shellTracker.updateShellStatus(
      'non-existent-id',
      ShellStatus.COMPLETED,
    );

    expect(updated).toBe(false);
  });

  it('should filter shells by status', () => {
    // Create shells with different statuses
    const shell1 = {
      id: 'shell-1',
      status: ShellStatus.RUNNING,
      startTime: new Date(),
      metadata: {
        command: 'command1',
      },
    };

    const shell2 = {
      id: 'shell-2',
      status: ShellStatus.COMPLETED,
      startTime: new Date(),
      endTime: new Date(),
      metadata: {
        command: 'command2',
        exitCode: 0,
      },
    };

    const shell3 = {
      id: 'shell-3',
      status: ShellStatus.ERROR,
      startTime: new Date(),
      endTime: new Date(),
      metadata: {
        command: 'command3',
        exitCode: 1,
        error: 'Error message',
      },
    };

    // Add the shells directly to the map
    shellTracker['shells'].set('shell-1', shell1);
    shellTracker['shells'].set('shell-2', shell2);
    shellTracker['shells'].set('shell-3', shell3);

    // Get all shells
    const allShells = shellTracker.getShells();
    expect(allShells.length).toBe(3);

    // Get running shells
    const runningShells = shellTracker.getShells(ShellStatus.RUNNING);
    expect(runningShells.length).toBe(1);
    expect(runningShells.length).toBe(1);
    expect(runningShells[0]!.id).toBe('shell-1');

    // Get completed shells
    const completedShells = shellTracker.getShells(ShellStatus.COMPLETED);
    expect(completedShells.length).toBe(1);
    expect(completedShells.length).toBe(1);
    expect(completedShells[0]!.id).toBe('shell-2');

    // Get error shells
    const errorShells = shellTracker.getShells(ShellStatus.ERROR);
    expect(errorShells.length).toBe(1);
    expect(errorShells.length).toBe(1);
    expect(errorShells[0]!.id).toBe('shell-3');
  });
});
