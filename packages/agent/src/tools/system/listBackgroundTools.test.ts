import { describe, expect, it, vi } from 'vitest';

import { BackgroundTools } from '../../core/backgroundTools.js';

import { listBackgroundToolsTool } from './listBackgroundTools.js';

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
      backgroundTools: new BackgroundTools('test'),
    } as any);

    expect(result.count).toEqual(0);
    expect(result.tools).toHaveLength(0);
  });
});
