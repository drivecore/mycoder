import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { shellStartTool } from './shellStart';

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
      {
        logger: mockLogger as any,
        workingDirectory: '/test',
        shellTracker: mockShellTracker as any,
      },
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
      {
        logger: mockLogger as any,
        workingDirectory: '/test',
        shellTracker: mockShellTracker as any,
      },
    );

    // Check that spawn was called with the correct base64 encoding command
    expect(spawn).toHaveBeenCalledWith(
      'bash',
      ['-c', expect.stringContaining('echo') && expect.stringContaining('base64 -d | cat')],
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
      {
        logger: mockLogger as any,
        workingDirectory: '/test',
        shellTracker: mockShellTracker as any,
      },
    );

    // Check that spawn was called with the correct PowerShell command
    expect(spawn).toHaveBeenCalledWith(
      'powershell',
      ['-Command', expect.stringContaining('[System.Text.Encoding]::UTF8.GetString') && expect.stringContaining('cat')],
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
    await shellStartTool.execute(
      {
        command: 'cat',
        description: 'Testing log messages',
        stdinContent: 'test content',
        showStdIn: true,
      },
      {
        logger: mockLogger as any,
        workingDirectory: '/test',
        shellTracker: mockShellTracker as any,
      },
    );

    expect(mockLogger.log).toHaveBeenCalledWith('Command input: cat');
    expect(mockLogger.log).toHaveBeenCalledWith('Stdin content: test content');
    expect(mockLogger.debug).toHaveBeenCalledWith('Starting shell command: cat');
    expect(mockLogger.debug).toHaveBeenCalledWith('With stdin content of length: 12');
  });
});