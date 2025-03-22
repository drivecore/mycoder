import { describe, expect, it } from 'vitest';

import { getMockToolContext } from '../getTools.test.js';

import { thinkTool } from './think.js';

describe('thinkTool', () => {
  const mockContext = getMockToolContext();

  it('should have the correct name and description', () => {
    expect(thinkTool.name).toBe('think');
    expect(thinkTool.description).toContain(
      'Use the tool to think about something',
    );
  });

  it('should return the thought that was provided', async () => {
    const thought =
      'I need to consider all possible solutions before deciding on an approach.';
    const result = await thinkTool.execute({ thought }, mockContext);

    expect(result).toEqual({ thought });
  });

  it('should accept any string as a thought', async () => {
    const thoughts = [
      'Simple thought',
      'Complex thought with multiple steps:\n1. First consider X\n2. Then Y\n3. Finally Z',
      'A question to myself: what if we tried a different approach?',
    ];

    for (const thought of thoughts) {
      const result = await thinkTool.execute({ thought }, mockContext);
      expect(result).toEqual({ thought });
    }
  });
});
