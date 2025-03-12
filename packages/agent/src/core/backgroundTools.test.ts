import { describe, expect, it, vi, beforeEach } from 'vitest';

import {
  backgroundToolRegistry,
  BackgroundToolStatus,
  BackgroundToolType,
} from './backgroundTools.js';

// Mock uuid to return predictable IDs for testing
vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('test-id-1'), // Always return the same ID for simplicity in tests
}));

describe('BackgroundToolRegistry', () => {
  beforeEach(() => {
    // Clear all registered tools before each test
    const registry = backgroundToolRegistry as any;
    registry.tools = new Map();
  });

  it('should register a shell process', () => {
    const id = backgroundToolRegistry.registerShell('agent-1', 'ls -la');

    expect(id).toBe('test-id-1');

    const tool = backgroundToolRegistry.getToolById(id);
    expect(tool).toBeDefined();
    if (tool) {
      expect(tool.type).toBe(BackgroundToolType.SHELL);
      expect(tool.status).toBe(BackgroundToolStatus.RUNNING);
      expect(tool.agentId).toBe('agent-1');
      if (tool.type === BackgroundToolType.SHELL) {
        expect(tool.metadata.command).toBe('ls -la');
      }
    }
  });

  it('should register a browser process', () => {
    const id = backgroundToolRegistry.registerBrowser(
      'agent-1',
      'https://example.com',
    );

    expect(id).toBe('test-id-1');

    const tool = backgroundToolRegistry.getToolById(id);
    expect(tool).toBeDefined();
    if (tool) {
      expect(tool.type).toBe(BackgroundToolType.BROWSER);
      expect(tool.status).toBe(BackgroundToolStatus.RUNNING);
      expect(tool.agentId).toBe('agent-1');
      if (tool.type === BackgroundToolType.BROWSER) {
        expect(tool.metadata.url).toBe('https://example.com');
      }
    }
  });

  it('should update tool status', () => {
    const id = backgroundToolRegistry.registerShell('agent-1', 'sleep 10');

    const updated = backgroundToolRegistry.updateToolStatus(
      id,
      BackgroundToolStatus.COMPLETED,
      {
        exitCode: 0,
      },
    );

    expect(updated).toBe(true);

    const tool = backgroundToolRegistry.getToolById(id);
    expect(tool).toBeDefined();
    if (tool) {
      expect(tool.status).toBe(BackgroundToolStatus.COMPLETED);
      expect(tool.endTime).toBeDefined();
      if (tool.type === BackgroundToolType.SHELL) {
        expect(tool.metadata.exitCode).toBe(0);
      }
    }
  });

  it('should return false when updating non-existent tool', () => {
    const updated = backgroundToolRegistry.updateToolStatus(
      'non-existent-id',
      BackgroundToolStatus.COMPLETED,
    );

    expect(updated).toBe(false);
  });

  it('should get tools by agent ID', () => {
    // For this test, we'll directly manipulate the tools map
    const registry = backgroundToolRegistry as any;
    registry.tools = new Map();

    // Add tools directly to the map with different agent IDs
    registry.tools.set('id1', {
      id: 'id1',
      type: BackgroundToolType.SHELL,
      status: BackgroundToolStatus.RUNNING,
      startTime: new Date(),
      agentId: 'agent-1',
      metadata: { command: 'ls -la' },
    });

    registry.tools.set('id2', {
      id: 'id2',
      type: BackgroundToolType.BROWSER,
      status: BackgroundToolStatus.RUNNING,
      startTime: new Date(),
      agentId: 'agent-1',
      metadata: { url: 'https://example.com' },
    });

    registry.tools.set('id3', {
      id: 'id3',
      type: BackgroundToolType.SHELL,
      status: BackgroundToolStatus.RUNNING,
      startTime: new Date(),
      agentId: 'agent-2',
      metadata: { command: 'echo hello' },
    });

    const agent1Tools = backgroundToolRegistry.getToolsByAgent('agent-1');
    const agent2Tools = backgroundToolRegistry.getToolsByAgent('agent-2');

    expect(agent1Tools.length).toBe(2);
    expect(agent2Tools.length).toBe(1);
  });

  it('should clean up old completed tools', () => {
    // Create tools with specific dates
    const registry = backgroundToolRegistry as any;

    // Add a completed tool from 25 hours ago
    const oldTool = {
      id: 'old-tool',
      type: BackgroundToolType.SHELL,
      status: BackgroundToolStatus.COMPLETED,
      startTime: new Date(Date.now() - 25 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 25 * 60 * 60 * 1000),
      agentId: 'agent-1',
      metadata: { command: 'echo old' },
    };

    // Add a completed tool from 10 hours ago
    const recentTool = {
      id: 'recent-tool',
      type: BackgroundToolType.SHELL,
      status: BackgroundToolStatus.COMPLETED,
      startTime: new Date(Date.now() - 10 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 10 * 60 * 60 * 1000),
      agentId: 'agent-1',
      metadata: { command: 'echo recent' },
    };

    // Add a running tool from 25 hours ago
    const oldRunningTool = {
      id: 'old-running-tool',
      type: BackgroundToolType.SHELL,
      status: BackgroundToolStatus.RUNNING,
      startTime: new Date(Date.now() - 25 * 60 * 60 * 1000),
      agentId: 'agent-1',
      metadata: { command: 'sleep 100' },
    };

    registry.tools.set('old-tool', oldTool);
    registry.tools.set('recent-tool', recentTool);
    registry.tools.set('old-running-tool', oldRunningTool);

    // Clean up tools older than 24 hours
    backgroundToolRegistry.cleanupOldTools(24);

    // Old completed tool should be removed
    expect(backgroundToolRegistry.getToolById('old-tool')).toBeUndefined();

    // Recent completed tool should remain
    expect(backgroundToolRegistry.getToolById('recent-tool')).toBeDefined();

    // Old running tool should remain (not completed)
    expect(
      backgroundToolRegistry.getToolById('old-running-tool'),
    ).toBeDefined();
  });
});
