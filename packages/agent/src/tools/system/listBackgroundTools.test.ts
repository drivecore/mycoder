import { describe, expect, it, vi } from 'vitest';

import { listBackgroundToolsTool } from './listBackgroundTools.js';

// Mock the entire background tools module
vi.mock('../../core/backgroundTools.js', () => {
  return {
    backgroundTools: {
      getToolsByAgent: vi.fn().mockReturnValue([
        {
          id: 'shell-1',
          type: 'shell',
          status: 'running',
          startTime: new Date(Date.now() - 10000),
          agentId: 'agent-1',
          metadata: { command: 'ls -la' },
        },
      ]),
    },
    BackgroundToolStatus: {
      RUNNING: 'running',
      COMPLETED: 'completed',
      ERROR: 'error',
      TERMINATED: 'terminated',
    },
    BackgroundToolType: {
      SHELL: 'shell',
      BROWSER: 'browser',
      AGENT: 'agent',
    },
  };
});

describe('listBackgroundTools tool', () => {
  const mockLogger = {
    debug: vi.fn(),
    verbose: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  it('should list background tools', async () => {
    const result = await listBackgroundToolsTool.execute({}, {
      logger: mockLogger as any,
      agentId: 'agent-1',
    } as any);

    expect(result.count).toEqual(1);
    expect(result.tools).toHaveLength(1);
  });
});
