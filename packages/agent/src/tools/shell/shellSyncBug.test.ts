import { describe, it, expect, beforeEach } from 'vitest';

import { ShellStatus, ShellTracker } from './ShellTracker';

/**
 * This test directly verifies the suspected bug in ShellTracker
 * where shell processes aren't properly marked as completed when
 * they finish in sync mode.
 */
describe('ShellTracker sync bug', () => {
  const shellTracker = new ShellTracker('test-agent');

  beforeEach(() => {
    // Clear all registered shells before each test
    shellTracker['shells'] = new Map();
    shellTracker.processStates.clear();
  });

  it('should correctly mark a sync command as completed', () => {
    // Step 1: Register a shell command
    const shellId = shellTracker.registerShell('echo test');

    // Verify it's marked as running
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(1);

    // Step 2: Update the shell status to completed (simulating sync completion)
    shellTracker.updateShellStatus(shellId, ShellStatus.COMPLETED, {
      exitCode: 0,
    });

    // Step 3: Verify it's no longer marked as running
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(0);

    // Step 4: Verify it's marked as completed
    expect(shellTracker.getShells(ShellStatus.COMPLETED).length).toBe(1);
  });

  it('should correctly mark a sync command with error as ERROR', () => {
    // Step 1: Register a shell command
    const shellId = shellTracker.registerShell('invalid command');

    // Verify it's marked as running
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(1);

    // Step 2: Update the shell status to error (simulating sync error)
    shellTracker.updateShellStatus(shellId, ShellStatus.ERROR, {
      exitCode: 1,
      error: 'Command not found',
    });

    // Step 3: Verify it's no longer marked as running
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(0);

    // Step 4: Verify it's marked as error
    expect(shellTracker.getShells(ShellStatus.ERROR).length).toBe(1);
  });

  it('should correctly handle multiple shell commands', () => {
    // Register multiple shell commands
    const shellId1 = shellTracker.registerShell('command 1');
    const shellId2 = shellTracker.registerShell('command 2');
    const shellId3 = shellTracker.registerShell('command 3');

    // Verify all are marked as running
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(3);

    // Update some statuses
    shellTracker.updateShellStatus(shellId1, ShellStatus.COMPLETED, {
      exitCode: 0,
    });
    shellTracker.updateShellStatus(shellId2, ShellStatus.ERROR, {
      exitCode: 1,
    });

    // Verify counts
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(1);
    expect(shellTracker.getShells(ShellStatus.COMPLETED).length).toBe(1);
    expect(shellTracker.getShells(ShellStatus.ERROR).length).toBe(1);

    // Update the last one
    shellTracker.updateShellStatus(shellId3, ShellStatus.COMPLETED, {
      exitCode: 0,
    });

    // Verify final counts
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(0);
    expect(shellTracker.getShells(ShellStatus.COMPLETED).length).toBe(2);
    expect(shellTracker.getShells(ShellStatus.ERROR).length).toBe(1);
  });
});
