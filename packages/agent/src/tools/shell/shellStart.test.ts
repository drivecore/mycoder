import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { shellStartTool } from './shellStart';

import type { ToolContext } from '../../core/types';

// Mock child_process.spawn
vi.mock('child_process', () => {
  const mockProcess = {
    on: vi.fn(),
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    stdin: { write: vi.fn(), writable: true },
  };

  return {
    spawn: vi.fn(() => mockProcess),
  };
});

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid'),
}));

describe('shellStartTool', () => {
  const mockLogger = {
    log: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  };

  const mockShellTracker = {
    registerShell: vi.fn(),
    updateShellStatus: vi.fn(),
    processStates: new Map(),
  };

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
    shellTracker: mockShellTracker as any,
    browserTracker: { registerSession: vi.fn() } as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should execute a shell command without stdinContent', async () => {
    const { spawn } = await import('child_process');

    const result = await shellStartTool.execute(
      {
        command: 'echo "test"',
        description: 'Testing command',
        timeout: 0, // Force async mode for testing
      },
      mockToolContext,
    );

    expect(spawn).toHaveBeenCalledWith('echo "test"', [], {
      shell: true,
      cwd: '/test',
    });
    expect(result).toEqual({
      mode: 'async',
      instanceId: 'mock-uuid',
      stdout: '',
      stderr: '',
    });
  });

  it('should execute a shell command with stdinContent on non-Windows', async () => {
    const { spawn } = await import('child_process');
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
      writable: true,
    });

    const result = await shellStartTool.execute(
      {
        command: 'cat',
        description: 'Testing with stdin content',
        timeout: 0, // Force async mode for testing
        stdinContent: 'test content',
      },
      mockToolContext,
    );

    // Check that spawn was called with the correct base64 encoding command
    expect(spawn).toHaveBeenCalledWith(
      'bash',
      [
        '-c',
        expect.stringContaining('echo') &&
          expect.stringContaining('base64 -d | cat'),
      ],
      { cwd: '/test' },
    );

    expect(result).toEqual({
      mode: 'async',
      instanceId: 'mock-uuid',
      stdout: '',
      stderr: '',
    });

    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      writable: true,
    });
  });

  it('should execute a shell command with stdinContent on Windows', async () => {
    const { spawn } = await import('child_process');
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', {
      value: 'win32',
      writable: true,
    });

    const result = await shellStartTool.execute(
      {
        command: 'cat',
        description: 'Testing with stdin content on Windows',
        timeout: 0, // Force async mode for testing
        stdinContent: 'test content',
      },
      mockToolContext,
    );

    // Check that spawn was called with the correct PowerShell command
    expect(spawn).toHaveBeenCalledWith(
      'powershell',
      [
        '-Command',
        expect.stringContaining('[System.Text.Encoding]::UTF8.GetString') &&
          expect.stringContaining('cat'),
      ],
      { cwd: '/test' },
    );

    expect(result).toEqual({
      mode: 'async',
      instanceId: 'mock-uuid',
      stdout: '',
      stderr: '',
    });

    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      writable: true,
    });
  });

  it('should include stdinContent information in log messages', async () => {
    // Use a timeout of 0 to force async mode and avoid waiting
    await shellStartTool.execute(
      {
        command: 'cat',
        description: 'Testing log messages',
        stdinContent: 'test content',
        showStdIn: true,
        timeout: 0,
      },
      mockToolContext,
    );

    expect(mockLogger.log).toHaveBeenCalledWith('Command input: cat');
    expect(mockLogger.log).toHaveBeenCalledWith('Stdin content: test content');
    expect(mockLogger.debug).toHaveBeenCalledWith(
      'Starting shell command: cat',
    );
    expect(mockLogger.debug).toHaveBeenCalledWith(
      'With stdin content of length: 12',
    );
  });
});
