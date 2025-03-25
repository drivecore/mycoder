import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shellStartTool } from './shellStart';
import { ShellStatus, ShellTracker } from './ShellTracker';

import type { ToolContext } from '../../core/types';

/**
 * Tests for the shellStart bug fix where shellId wasn't being properly 
 * tracked for shell status updates.
 */
describe('shellStart bug fix', () => {
  // Create a mock ShellTracker with the real implementation
  const shellTracker = new ShellTracker('test-agent');
  
  // Spy on the real methods
  const registerShellSpy = vi.spyOn(shellTracker, 'registerShell');
  const updateShellStatusSpy = vi.spyOn(shellTracker, 'updateShellStatus');
  
  // Create a mock process that allows us to trigger events
  const mockProcess = {
    on: vi.fn((event, handler) => {
      mockProcess[`${event}Handler`] = handler;
      return mockProcess;
    }),
    stdout: { 
      on: vi.fn((event, handler) => {
        mockProcess[`stdout${event}Handler`] = handler;
        return mockProcess.stdout;
      }) 
    },
    stderr: { 
      on: vi.fn((event, handler) => {
        mockProcess[`stderr${event}Handler`] = handler;
        return mockProcess.stderr;
      }) 
    },
    // Trigger an exit event
    triggerExit: (code: number, signal: string | null) => {
      mockProcess[`exitHandler`]?.(code, signal);
    },
    // Trigger an error event
    triggerError: (error: Error) => {
      mockProcess[`errorHandler`]?.(error);
    }
  };
  
  // Mock child_process.spawn
  vi.mock('child_process', () => ({
    spawn: vi.fn(() => mockProcess)
  }));
  
  // Create mock logger
  const mockLogger = {
    log: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  };
  
  // Create mock context
  const mockContext: ToolContext = {
    logger: mockLogger as any,
    workingDirectory: '/test',
    headless: false,
    userSession: false,
    tokenTracker: { trackTokens: vi.fn() } as any,
    githubMode: false,
    provider: 'anthropic',
    maxTokens: 4000,
    temperature: 0,
    agentTracker: { registerAgent: vi.fn() } as any,
    shellTracker: shellTracker as any,
    browserTracker: { registerSession: vi.fn() } as any,
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    shellTracker['shells'] = new Map();
    shellTracker.processStates.clear();
  });
  
  it('should use the shellId returned from registerShell when updating status', async () => {
    // Start the shell command
    const commandPromise = shellStartTool.execute(
      { command: 'test command', description: 'Test', timeout: 5000 },
      mockContext
    );
    
    // Verify registerShell was called with the correct command
    expect(registerShellSpy).toHaveBeenCalledWith('test command');
    
    // Get the shellId that was generated
    const shellId = registerShellSpy.mock.results[0].value;
    
    // Verify the shell is registered as running
    const runningShells = shellTracker.getShells(ShellStatus.RUNNING);
    expect(runningShells.length).toBe(1);
    expect(runningShells[0].shellId).toBe(shellId);
    
    // Trigger the process to complete
    mockProcess.triggerExit(0, null);
    
    // Await the command to complete
    const result = await commandPromise;
    
    // Verify we got a sync response
    expect(result.mode).toBe('sync');
    
    // Verify updateShellStatus was called with the correct shellId
    expect(updateShellStatusSpy).toHaveBeenCalledWith(
      shellId,
      ShellStatus.COMPLETED,
      expect.objectContaining({ exitCode: 0 })
    );
    
    // Verify the shell is now marked as completed
    const completedShells = shellTracker.getShells(ShellStatus.COMPLETED);
    expect(completedShells.length).toBe(1);
    expect(completedShells[0].shellId).toBe(shellId);
    
    // Verify no shells are left in running state
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(0);
  });
  
  it('should properly update status when process fails', async () => {
    // Start the shell command
    const commandPromise = shellStartTool.execute(
      { command: 'failing command', description: 'Test failure', timeout: 5000 },
      mockContext
    );
    
    // Get the shellId that was generated
    const shellId = registerShellSpy.mock.results[0].value;
    
    // Trigger the process to fail
    mockProcess.triggerExit(1, null);
    
    // Await the command to complete
    const result = await commandPromise;
    
    // Verify we got a sync response with error
    expect(result.mode).toBe('sync');
    expect(result.exitCode).toBe(1);
    
    // Verify updateShellStatus was called with the correct shellId and ERROR status
    expect(updateShellStatusSpy).toHaveBeenCalledWith(
      shellId,
      ShellStatus.ERROR,
      expect.objectContaining({ exitCode: 1 })
    );
    
    // Verify the shell is now marked as error
    const errorShells = shellTracker.getShells(ShellStatus.ERROR);
    expect(errorShells.length).toBe(1);
    expect(errorShells[0].shellId).toBe(shellId);
    
    // Verify no shells are left in running state
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(0);
  });
  
  it('should properly update status in async mode', async () => {
    // Start the shell command with very short timeout to force async mode
    const commandPromise = shellStartTool.execute(
      { command: 'long command', description: 'Test async', timeout: 0 },
      mockContext
    );
    
    // Get the shellId that was generated
    const shellId = registerShellSpy.mock.results[0].value;
    
    // Await the command (which should return in async mode due to timeout=0)
    const result = await commandPromise;
    
    // Verify we got an async response
    expect(result.mode).toBe('async');
    expect(result.shellId).toBe(shellId);
    
    // Shell should still be running
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(1);
    
    // Now trigger the process to complete
    mockProcess.triggerExit(0, null);
    
    // Verify updateShellStatus was called with the correct shellId
    expect(updateShellStatusSpy).toHaveBeenCalledWith(
      shellId,
      ShellStatus.COMPLETED,
      expect.objectContaining({ exitCode: 0 })
    );
    
    // Verify the shell is now marked as completed
    const completedShells = shellTracker.getShells(ShellStatus.COMPLETED);
    expect(completedShells.length).toBe(1);
    expect(completedShells[0].shellId).toBe(shellId);
    
    // Verify no shells are left in running state
    expect(shellTracker.getShells(ShellStatus.RUNNING).length).toBe(0);
  });
});