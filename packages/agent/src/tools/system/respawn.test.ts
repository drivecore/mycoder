import { describe, it, expect } from 'vitest';

import { ToolContext } from '../../core/types';
import { getMockToolContext } from '../getTools.test';

import { respawnTool } from './respawn';

const toolContext: ToolContext = getMockToolContext();

describe('respawnTool', () => {
  it('should have correct name and description', () => {
    expect(respawnTool.name).toBe('respawn');
    expect(respawnTool.description).toContain('Resets the agent context');
  });

  it('should execute and return confirmation message', async () => {
    const result = await respawnTool.execute(
      { respawnContext: 'new context' },
      toolContext,
    );
    expect(result).toBe('Respawn initiated');
  });
});
