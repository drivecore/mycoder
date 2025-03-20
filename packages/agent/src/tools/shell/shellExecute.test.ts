import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { shellExecuteTool } from './shellExecute';

// Mock child_process.exec
vi.mock('child_process', () => {
  return {
    exec: vi.fn(),
  };
});

// Mock util.promisify to return our mocked exec
vi.mock('util', () => {
  return {
    promisify: vi.fn((_fn) => {
      return async () => {
        return { stdout: 'mocked stdout', stderr: 'mocked stderr' };
      };
    }),
  };
});

describe('shellExecuteTool', () => {
  const mockLogger = {
    log: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should execute a shell command without stdinContent', async () => {
    const result = await shellExecuteTool.execute(
      {
        command: 'echo "test"',
        description: 'Testing command',
      },
      {
        logger: mockLogger as any,
      },
    );

    expect(mockLogger.debug).toHaveBeenCalledWith(
      'Executing shell command with 30000ms timeout: echo "test"',
    );
    expect(result).toEqual({
      stdout: 'mocked stdout',
      stderr: 'mocked stderr',
      code: 0,
      error: '',
      command: 'echo "test"',
    });
  });

  it('should execute a shell command with stdinContent', async () => {
    const result = await shellExecuteTool.execute(
      {
        command: 'cat',
        description: 'Testing with stdin content',
        stdinContent: 'test content',
      },
      {
        logger: mockLogger as any,
      },
    );

    expect(mockLogger.debug).toHaveBeenCalledWith(
      'Executing shell command with 30000ms timeout: cat',
    );
    expect(mockLogger.debug).toHaveBeenCalledWith(
      'With stdin content of length: 12',
    );
    expect(result).toEqual({
      stdout: 'mocked stdout',
      stderr: 'mocked stderr',
      code: 0,
      error: '',
      command: 'cat',
    });
  });

  it('should include stdinContent in log parameters', () => {
    shellExecuteTool.logParameters(
      {
        command: 'cat',
        description: 'Testing log parameters',
        stdinContent: 'test content',
      },
      {
        logger: mockLogger as any,
      },
    );

    expect(mockLogger.log).toHaveBeenCalledWith(
      'Running "cat", Testing log parameters (with stdin content)',
    );
  });

  it('should handle errors during execution', async () => {
    // Override the promisify mock to throw an error
    vi.mocked(vi.importActual('util') as any).promisify.mockImplementationOnce(
      () => {
        return async () => {
          throw new Error('Command failed');
        };
      },
    );

    const result = await shellExecuteTool.execute(
      {
        command: 'invalid-command',
        description: 'Testing error handling',
      },
      {
        logger: mockLogger as any,
      },
    );

    expect(mockLogger.debug).toHaveBeenCalledWith(
      'Executing shell command with 30000ms timeout: invalid-command',
    );
    expect(result.error).toContain('Command failed');
    expect(result.code).toBe(-1);
  });
});