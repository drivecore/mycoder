import { describe, it, expect } from 'vitest';

import { ToolContext } from '../../core/types.js';
import { getMockToolContext } from '../getTools.test.js';

import { shellExecuteTool } from './shellExecute.js';

const toolContext: ToolContext = getMockToolContext();

describe('shellExecute', () => {
  it('should execute shell commands', async () => {
    const { stdout } = await shellExecuteTool.execute(
      { command: "echo 'test'", description: 'test' },
      toolContext,
    );
    expect(stdout).toContain('test');
  });

  it('should handle command errors', async () => {
    const { error } = await shellExecuteTool.execute(
      { command: 'nonexistentcommand', description: 'test' },
      toolContext,
    );
    expect(error).toContain('Command failed:');
  });
});
