import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { TokenTracker } from '../../core/tokens.js';
import { ToolContext } from '../../core/types.js';
import * as githubUtils from '../../utils/github.js';
import { MockLogger } from '../../utils/mockLogger.js';
import { sleep } from '../../utils/sleep.js';

import { processStates, shellStartTool } from './shellStart.js';

const toolContext: ToolContext = {
  logger: new MockLogger(),
  headless: true,
  workingDirectory: '.',
  userSession: false,
  pageFilter: 'simple',
  tokenTracker: new TokenTracker(),
  githubMode: false,
};
describe('shellStartTool', () => {
  beforeEach(() => {
    processStates.clear();
  });

  afterEach(() => {
    for (const processState of processStates.values()) {
      processState.process.kill();
    }
    processStates.clear();
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
    expect(processStates.size).toBeGreaterThan(0);
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
      expect(processStates.has(asyncResult.instanceId)).toBe(true);
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

      const processState = processStates.get(result.instanceId);
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

  it('should format GitHub CLI commands correctly in GitHub mode', async () => {
    // Create a GitHub mode context
    const githubModeContext: ToolContext = {
      ...toolContext,
      githubMode: true,
    };

    // Spy on formatGitHubText function
    const formatSpy = vi.spyOn(githubUtils, 'formatGitHubText');
    formatSpy.mockImplementation((text) => `FORMATTED:${text}`);

    // Test with a GitHub CLI command that has a body
    await shellStartTool.execute(
      {
        command: 'gh issue create --title "Test Issue" --body "Line 1\\nLine 2"',
        description: 'GitHub CLI test',
        timeout: 100,
      },
      githubModeContext,
    );

    // Verify formatGitHubText was called
    expect(formatSpy).toHaveBeenCalled();
    
    // Test with a non-GitHub command (should not format)
    formatSpy.mockClear();
    await shellStartTool.execute(
      {
        command: 'echo "Not a GitHub command"',
        description: 'Non-GitHub command test',
        timeout: 100,
      },
      githubModeContext,
    );

    // Verify formatGitHubText was not called for non-GitHub commands
    expect(formatSpy).not.toHaveBeenCalled();
    
    // Restore the original implementation
    formatSpy.mockRestore();
  });
});
