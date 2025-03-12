import { exec } from 'child_process';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { checkGitCli } from './gitCliCheck';

// Mock the child_process module
vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

// Mock the util module
vi.mock('util', () => ({
  promisify: vi.fn((fn) => {
    return (cmd: string) => {
      return new Promise((resolve, reject) => {
        fn(cmd, (error: Error | null, result: { stdout: string }) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      });
    };
  }),
}));

describe('gitCliCheck', () => {
  const mockExec = exec as unknown as vi.Mock;

  beforeEach(() => {
    mockExec.mockReset();
  });

  it('should return all true when git and gh are available and authenticated', async () => {
    // Mock successful responses
    mockExec.mockImplementation(
      (
        cmd: string,
        callback: (error: Error | null, result: { stdout: string }) => void,
      ) => {
        if (cmd === 'git --version') {
          callback(null, { stdout: 'git version 2.30.1' });
        } else if (cmd === 'gh --version') {
          callback(null, { stdout: 'gh version 2.0.0' });
        } else if (cmd === 'gh auth status') {
          callback(null, { stdout: 'Logged in to github.com as username' });
        }
      },
    );

    const result = await checkGitCli();

    expect(result.gitAvailable).toBe(true);
    expect(result.ghAvailable).toBe(true);
    expect(result.ghAuthenticated).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect when git is not available', async () => {
    mockExec.mockImplementation(
      (
        cmd: string,
        callback: (error: Error | null, result: { stdout: string }) => void,
      ) => {
        if (cmd === 'git --version') {
          callback(new Error('Command not found'), { stdout: '' });
        } else if (cmd === 'gh --version') {
          callback(null, { stdout: 'gh version 2.0.0' });
        } else if (cmd === 'gh auth status') {
          callback(null, { stdout: 'Logged in to github.com as username' });
        }
      },
    );

    const result = await checkGitCli();

    expect(result.gitAvailable).toBe(false);
    expect(result.ghAvailable).toBe(true);
    expect(result.ghAuthenticated).toBe(true);
    expect(result.errors).toContain(
      'Git CLI is not available. Please install git.',
    );
  });

  it('should detect when gh is not available', async () => {
    mockExec.mockImplementation(
      (
        cmd: string,
        callback: (error: Error | null, result: { stdout: string }) => void,
      ) => {
        if (cmd === 'git --version') {
          callback(null, { stdout: 'git version 2.30.1' });
        } else if (cmd === 'gh --version') {
          callback(new Error('Command not found'), { stdout: '' });
        }
      },
    );

    const result = await checkGitCli();

    expect(result.gitAvailable).toBe(true);
    expect(result.ghAvailable).toBe(false);
    expect(result.ghAuthenticated).toBe(false);
    expect(result.errors).toContain(
      'GitHub CLI is not available. Please install gh CLI.',
    );
  });

  it('should detect when gh is not authenticated', async () => {
    mockExec.mockImplementation(
      (
        cmd: string,
        callback: (error: Error | null, result: { stdout: string }) => void,
      ) => {
        if (cmd === 'git --version') {
          callback(null, { stdout: 'git version 2.30.1' });
        } else if (cmd === 'gh --version') {
          callback(null, { stdout: 'gh version 2.0.0' });
        } else if (cmd === 'gh auth status') {
          callback(new Error('You are not logged into any GitHub hosts'), {
            stdout: '',
          });
        }
      },
    );

    const result = await checkGitCli();

    expect(result.gitAvailable).toBe(true);
    expect(result.ghAvailable).toBe(true);
    expect(result.ghAuthenticated).toBe(false);
    expect(result.errors).toContain(
      'GitHub CLI is not authenticated. Please run "gh auth login".',
    );
  });
});
