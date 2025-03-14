import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { ToolContext } from '../../core/types.js';
import { sleep } from '../../utils/sleep.js';
import { getMockToolContext } from '../getTools.test.js';

import { shellStartTool } from './shellStart.js';
import { shellTracker } from './ShellTracker.js';

const toolContext: ToolContext = getMockToolContext();

describe('shellStartTool', () => {
  beforeEach(() => {
    shellTracker.processStates.clear();
  });

  afterEach(() => {
    for (const processState of shellTracker.processStates.values()) {
      processState.process.kill();
    }
    shellTracker.processStates.clear();
  });

  it('should handle fast commands in sync mode', async () => {
    const result = await shellStartTool.execute(
      {
        command: 'echo "test"',
        description: 'Test process',
        timeout: 500, // Generous timeout to ensure sync mode
      },
      toolContext,
    );

    expect(result.mode).toBe('sync');
    if (result.mode === 'sync') {
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('test');
      expect(result.error).toBeUndefined();
    }
  });

  it('should switch to async mode for slow commands', async () => {
    const result = await shellStartTool.execute(
      {
        command: 'sleep 1',
        description: 'Slow command test',
        timeout: 50, // Short timeout to force async mode
      },
      toolContext,
    );

    expect(result.mode).toBe('async');
    if (result.mode === 'async') {
      expect(result.instanceId).toBeDefined();
      expect(result.error).toBeUndefined();
    }
  });

  it('should handle invalid commands with sync error', async () => {
    const result = await shellStartTool.execute(
      {
        command: 'nonexistentcommand',
        description: 'Invalid command test',
      },
      toolContext,
    );

    expect(result.mode).toBe('sync');
    if (result.mode === 'sync') {
      expect(result.exitCode).not.toBe(0);
      expect(result.error).toBeDefined();
    }
  });

  it('should keep process in processStates in both modes', async () => {
    // Test sync mode
    const syncResult = await shellStartTool.execute(
      {
        command: 'echo "test"',
        description: 'Sync completion test',
        timeout: 500,
      },
      toolContext,
    );

    // Even sync results should be in processStates
    expect(shellTracker.processStates.size).toBeGreaterThan(0);
    expect(syncResult.mode).toBe('sync');
    expect(syncResult.error).toBeUndefined();
    if (syncResult.mode === 'sync') {
      expect(syncResult.exitCode).toBe(0);
    }

    // Test async mode
    const asyncResult = await shellStartTool.execute(
      {
        command: 'sleep 1',
        description: 'Async completion test',
        timeout: 50,
      },
      toolContext,
    );

    if (asyncResult.mode === 'async') {
      expect(shellTracker.processStates.has(asyncResult.instanceId)).toBe(true);
    }
  });

  it('should handle piped commands correctly in async mode', async () => {
    const result = await shellStartTool.execute(
      {
        command: 'grep "test"',
        description: 'Pipe test',
        timeout: 50, // Force async for interactive command
      },
      toolContext,
    );

    expect(result.mode).toBe('async');
    if (result.mode === 'async') {
      expect(result.instanceId).toBeDefined();
      expect(result.error).toBeUndefined();

      const processState = shellTracker.processStates.get(result.instanceId);
      expect(processState).toBeDefined();

      if (processState?.process.stdin) {
        processState.process.stdin.write('this is a test line\n');
        processState.process.stdin.write('not matching line\n');
        processState.process.stdin.write('another test here\n');
        processState.process.stdin.end();

        // Wait for output
        await sleep(200);

        // Check stdout in processState
        expect(processState.stdout.join('')).toContain('test');
        expect(processState.stdout.join('')).not.toContain('not matching');
      }
    }
  });

  it('should use default timeout of 10000ms', async () => {
    const result = await shellStartTool.execute(
      {
        command: 'sleep 1',
        description: 'Default timeout test',
      },
      toolContext,
    );

    expect(result.mode).toBe('sync');
  });

  it('should store showStdIn and showStdout settings in process state', async () => {
    const result = await shellStartTool.execute(
      {
        command: 'echo "test"',
        description: 'Test with stdout visibility',
        showStdIn: true,
        showStdout: true,
      },
      toolContext,
    );

    expect(result.mode).toBe('sync');

    // For async mode, check the process state directly
    const asyncResult = await shellStartTool.execute(
      {
        command: 'sleep 1',
        description: 'Test with stdin/stdout visibility in async mode',
        timeout: 50, // Force async mode
        showStdIn: true,
        showStdout: true,
      },
      toolContext,
    );

    if (asyncResult.mode === 'async') {
      const processState = shellTracker.processStates.get(
        asyncResult.instanceId,
      );
      expect(processState).toBeDefined();
      expect(processState?.showStdIn).toBe(true);
      expect(processState?.showStdout).toBe(true);
    }
  });
});
