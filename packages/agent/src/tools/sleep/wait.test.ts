import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ToolContext } from '../../core/types';
import { getMockToolContext } from '../getTools.test';

import { waitTool } from './wait';

const toolContext: ToolContext = getMockToolContext();

describe('sleep tool', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should sleep for the specified duration', async () => {
    const sleepPromise = waitTool.execute({ seconds: 2 }, toolContext);

    await vi.advanceTimersByTimeAsync(2000);
    const result = await sleepPromise;

    expect(result).toEqual({ sleptFor: 2 });
  });

  it('should reject negative sleep duration', async () => {
    await expect(
      waitTool.execute({ seconds: -1 }, toolContext),
    ).rejects.toThrow();
  });

  it('should reject sleep duration over 1 hour', async () => {
    await expect(
      waitTool.execute({ seconds: 3601 }, toolContext),
    ).rejects.toThrow();
  });
});
