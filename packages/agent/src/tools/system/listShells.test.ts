import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ToolContext } from '../../core/types.js';
import { getMockToolContext } from '../getTools.test.js';

import { listShellsTool } from './listShells.js';
import { ShellStatus, shellTracker } from './ShellTracker.js';

const toolContext: ToolContext = getMockToolContext();

// Mock Date.now to return a consistent timestamp
const mockNow = new Date('2023-01-01T00:00:00Z').getTime();
vi.spyOn(Date, 'now').mockImplementation(() => mockNow);

describe('listShellsTool', () => {
  beforeEach(() => {
    // Clear shells before each test
    shellTracker['shells'] = new Map();

    // Set up some test shells with different statuses
    const shell1 = {
      id: 'shell-1',
      status: ShellStatus.RUNNING,
      startTime: new Date(mockNow - 1000 * 60 * 5), // 5 minutes ago
      metadata: {
        command: 'sleep 100',
      },
    };

    const shell2 = {
      id: 'shell-2',
      status: ShellStatus.COMPLETED,
      startTime: new Date(mockNow - 1000 * 60 * 10), // 10 minutes ago
      endTime: new Date(mockNow - 1000 * 60 * 9), // 9 minutes ago
      metadata: {
        command: 'echo "test"',
        exitCode: 0,
      },
    };

    const shell3 = {
      id: 'shell-3',
      status: ShellStatus.ERROR,
      startTime: new Date(mockNow - 1000 * 60 * 15), // 15 minutes ago
      endTime: new Date(mockNow - 1000 * 60 * 14), // 14 minutes ago
      metadata: {
        command: 'nonexistentcommand',
        exitCode: 127,
        error: 'Command not found',
      },
    };

    // Add the shells to the tracker
    shellTracker['shells'].set('shell-1', shell1);
    shellTracker['shells'].set('shell-2', shell2);
    shellTracker['shells'].set('shell-3', shell3);
  });

  it('should list all shells by default', async () => {
    const result = await listShellsTool.execute({}, toolContext);

    expect(result.shells.length).toBe(3);
    expect(result.count).toBe(3);

    // Check that shells are properly formatted
    const shell1 = result.shells.find((s) => s.id === 'shell-1');
    expect(shell1).toBeDefined();
    expect(shell1?.status).toBe(ShellStatus.RUNNING);
    expect(shell1?.command).toBe('sleep 100');
    expect(shell1?.runtime).toBeGreaterThan(0);

    // Metadata should not be included by default
    expect(shell1?.metadata).toBeUndefined();
  });

  it('should filter shells by status', async () => {
    const result = await listShellsTool.execute(
      { status: 'running' },
      toolContext,
    );

    expect(result.shells.length).toBe(1);
    expect(result.count).toBe(1);
    expect(result.shells.length).toBe(1);
    expect(result.shells[0]!.id).toBe('shell-1');
    expect(result.shells[0]!.status).toBe(ShellStatus.RUNNING);
  });

  it('should include metadata when verbose is true', async () => {
    const result = await listShellsTool.execute({ verbose: true }, toolContext);

    expect(result.shells.length).toBe(3);

    // Check that metadata is included
    const shell3 = result.shells.find((s) => s.id === 'shell-3');
    expect(shell3).toBeDefined();
    expect(shell3?.metadata).toBeDefined();
    expect(shell3?.metadata?.exitCode).toBe(127);
    expect(shell3?.metadata?.error).toBe('Command not found');
  });

  it('should combine status filter with verbose option', async () => {
    const result = await listShellsTool.execute(
      { status: 'error', verbose: true },
      toolContext,
    );

    expect(result.shells.length).toBe(1);
    expect(result.shells.length).toBe(1);
    expect(result.shells[0]!.id).toBe('shell-3');
    expect(result.shells[0]!.status).toBe(ShellStatus.ERROR);
    expect(result.shells[0]!.metadata).toBeDefined();
    expect(result.shells[0]!.metadata?.error).toBe('Command not found');
  });
});
