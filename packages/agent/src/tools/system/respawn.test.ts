import { describe, it, expect } from 'vitest';

import { ToolContext } from '../../core/types';
import { getMockToolContext } from '../getTools.test';

import { respawnTool } from './respawn';

const toolContext: ToolContext = getMockToolContext();

describe('respawnTool', () => {
  it('should have correct name', () => {
    expect(respawnTool.name).toBe('respawn');
  });

  it('should execute and return confirmation message', async () => {
    const result = await respawnTool.execute(
      { respawnContext: 'new context' },
      toolContext,
    );
    expect(result).toBe('Respawn initiated');
  });
});
