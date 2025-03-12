import { describe, expect, it, vi, beforeEach } from 'vitest';

import {
  BackgroundTools,
  BackgroundToolStatus,
  BackgroundToolType,
} from './backgroundTools.js';

// Mock uuid to return predictable IDs for testing
vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('test-id-1'), // Always return the same ID for simplicity in tests
}));

describe('BackgroundToolRegistry', () => {
  let backgroundTools: BackgroundTools;
  beforeEach(() => {
    // Clear all registered tools before each test
    backgroundTools = new BackgroundTools('test');
    backgroundTools.tools = new Map();
  });

  it('should register a shell process', () => {
    const id = backgroundTools.registerShell('ls -la');

    expect(id).toBe('test-id-1');

    const tool = backgroundTools.getToolById(id);
    expect(tool).toBeDefined();
    if (tool) {
      expect(tool.type).toBe(BackgroundToolType.SHELL);
      expect(tool.status).toBe(BackgroundToolStatus.RUNNING);
      if (tool.type === BackgroundToolType.SHELL) {
        expect(tool.metadata.command).toBe('ls -la');
      }
    }
  });

  it('should register a browser process', () => {
    const id = backgroundTools.registerBrowser('https://example.com');

    expect(id).toBe('test-id-1');

    const tool = backgroundTools.getToolById(id);
    expect(tool).toBeDefined();
    if (tool) {
      expect(tool.type).toBe(BackgroundToolType.BROWSER);
      expect(tool.status).toBe(BackgroundToolStatus.RUNNING);
      if (tool.type === BackgroundToolType.BROWSER) {
        expect(tool.metadata.url).toBe('https://example.com');
      }
    }
  });

  it('should update tool status', () => {
    const id = backgroundTools.registerShell('sleep 10');

    const updated = backgroundTools.updateToolStatus(
      id,
      BackgroundToolStatus.COMPLETED,
      {
        exitCode: 0,
      },
    );

    expect(updated).toBe(true);

    const tool = backgroundTools.getToolById(id);
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
    const updated = backgroundTools.updateToolStatus(
      'non-existent-id',
      BackgroundToolStatus.COMPLETED,
    );

    expect(updated).toBe(false);
  });

  it('should clean up old completed tools', () => {
    // Create tools with specific dates
    const registry = backgroundTools as any;

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
  });
});
