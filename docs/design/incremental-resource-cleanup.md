# Implementation Plan: Incremental Resource Cleanup

## Overview

This plan outlines the steps to implement incremental resource cleanup tied to agent lifecycles, ensuring that browser sessions, shell processes, and sub-agents are properly cleaned up when agents complete their tasks or encounter exceptions.

## Current Architecture Analysis

Based on code review:

1. **BackgroundTools** (packages/agent/src/core/backgroundTools.ts):
   - Maintains a registry of background tools (shells, browsers, agents)
   - Has methods to register and update status, but no cleanup methods

2. **Browser Management** (packages/agent/src/tools/browser/BrowserManager.ts):
   - Implemented as a global singleton accessible via `(globalThis as any).__BROWSER_MANAGER__`
   - Has methods to close individual sessions and all sessions
   - No direct connection to agent lifecycles

3. **Shell Process Management** (packages/agent/src/tools/system/shellStart.ts):
   - Processes stored in global `processStates` map
   - No direct connection to agent lifecycles
   - No specific cleanup method for individual processes

4. **Agent Management** (packages/agent/src/tools/interaction/agentStart.ts, agentMessage.ts):
   - Agents track their own background tools
   - Agents can be terminated, but no cleanup of associated resources

5. **Global Cleanup** (packages/cli/src/utils/cleanup.ts):
   - Single function that attempts to clean up all resources at application exit
   - No incremental cleanup capabilities

## Implementation Steps

### 1. Enhance BackgroundTools Class

Add a cleanup method to the BackgroundTools class:

```typescript
// In packages/agent/src/core/backgroundTools.ts

export class BackgroundTools {
  // ... existing code ...

  /**
   * Cleans up all resources associated with this agent instance
   * @returns A promise that resolves when cleanup is complete
   */
  public async cleanup(): Promise<void> {
    const tools = this.getTools();
    
    // Group tools by type for better cleanup organization
    const browserTools = tools.filter(
      (tool): tool is BrowserBackgroundTool => tool.type === BackgroundToolType.BROWSER
    );
    
    const shellTools = tools.filter(
      (tool): tool is ShellBackgroundTool => tool.type === BackgroundToolType.SHELL
    );
    
    const agentTools = tools.filter(
      (tool): tool is AgentBackgroundTool => tool.type === BackgroundToolType.AGENT
    );
    
    // Clean up browser sessions
    for (const tool of browserTools) {
      if (tool.status === BackgroundToolStatus.RUNNING) {
        try {
          const browserManager = (globalThis as any).__BROWSER_MANAGER__ as BrowserManager | undefined;
          if (browserManager) {
            await browserManager.closeSession(tool.id);
          }
          this.updateToolStatus(tool.id, BackgroundToolStatus.COMPLETED);
        } catch (error) {
          this.updateToolStatus(tool.id, BackgroundToolStatus.ERROR, {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
    
    // Clean up shell processes
    for (const tool of shellTools) {
      if (tool.status === BackgroundToolStatus.RUNNING) {
        try {
          const processState = processStates.get(tool.id);
          if (processState && !processState.state.completed) {
            processState.process.kill('SIGTERM');
            
            // Force kill after a short timeout if still running
            await new Promise<void>((resolve) => {
              setTimeout(() => {
                try {
                  if (!processState.state.completed) {
                    processState.process.kill('SIGKILL');
                  }
                } catch (e) {
                  // Ignore errors on forced kill
                }
                resolve();
              }, 500);
            });
          }
          this.updateToolStatus(tool.id, BackgroundToolStatus.COMPLETED);
        } catch (error) {
          this.updateToolStatus(tool.id, BackgroundToolStatus.ERROR, {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
    
    // Clean up sub-agents
    for (const tool of agentTools) {
      if (tool.status === BackgroundToolStatus.RUNNING) {
        try {
          const agentState = agentStates.get(tool.id);
          if (agentState && !agentState.aborted) {
            agentState.aborted = true;
            agentState.completed = true;
          }
          this.updateToolStatus(tool.id, BackgroundToolStatus.TERMINATED);
        } catch (error) {
          this.updateToolStatus(tool.id, BackgroundToolStatus.ERROR, {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }
}
```

### 2. Modify Agent Lifecycle Methods

Update the agent lifecycle methods to call the cleanup method:

```typescript
// In packages/agent/src/tools/interaction/agentStart.ts

// In the Promise.resolve().then() block:
try {
  const result = await toolAgent(prompt, tools, subAgentConfig, {
    ...context,
    workingDirectory: workingDirectory ?? context.workingDirectory,
  });

  // Update agent state with the result
  const state = agentStates.get(instanceId);
  if (state && !state.aborted) {
    state.completed = true;
    state.result = result;
    state.output = result.result;

    // Update background tool registry with completed status
    backgroundTools.updateToolStatus(
      instanceId,
      BackgroundToolStatus.COMPLETED,
      {
        result:
          result.result.substring(0, 100) +
          (result.result.length > 100 ? '...' : ''),
      },
    );
    
    // Clean up resources when agent completes successfully
    await backgroundTools.cleanup();
  }
} catch (error) {
  // Update agent state with the error
  const state = agentStates.get(instanceId);
  if (state && !state.aborted) {
    state.completed = true;
    state.error = error instanceof Error ? error.message : String(error);

    // Update background tool registry with error status
    backgroundTools.updateToolStatus(
      instanceId,
      BackgroundToolStatus.ERROR,
      {
        error: error instanceof Error ? error.message : String(error),
      },
    );
    
    // Clean up resources when agent encounters an error
    await backgroundTools.cleanup();
  }
}
```

### 3. Update Agent Termination

Modify the agent termination logic to clean up resources:

```typescript
// In packages/agent/src/tools/interaction/agentMessage.ts

// In the terminate block:
if (terminate) {
  agentState.aborted = true;
  agentState.completed = true;

  // Update background tool registry with terminated status
  backgroundTools.updateToolStatus(
    instanceId,
    BackgroundToolStatus.TERMINATED,
    {
      terminatedByUser: true,
    },
  );
  
  // Clean up resources when agent is terminated
  await backgroundTools.cleanup();

  return {
    output: agentState.output || 'Sub-agent terminated before completion',
    completed: true,
    terminated: true,
  };
}
```

### 4. Update Global Cleanup

Modify the global cleanup to use the new BackgroundTools cleanup method for any still-running agents:

```typescript
// In packages/cli/src/utils/cleanup.ts

export async function cleanupResources(): Promise<void> {
  console.log('Cleaning up resources before exit...');

  // First attempt to clean up any still-running agents
  // This will cascade to their browser sessions and shell processes
  try {
    // Find all active agent instances
    const activeAgents = Array.from(agentStates.entries())
      .filter(([_, state]) => !state.completed && !state.aborted);
    
    if (activeAgents.length > 0) {
      console.log(`Cleaning up ${activeAgents.length} active agents...`);
      
      for (const [id, state] of activeAgents) {
        try {
          // Mark the agent as aborted
          state.aborted = true;
          state.completed = true;
          
          // Clean up its resources
          await state.context.backgroundTools.cleanup();
        } catch (error) {
          console.error(`Error cleaning up agent ${id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up agents:', error);
  }

  // As a fallback, still clean up any browser sessions and shell processes
  // that might not have been caught by the agent cleanup

  // 1. Clean up browser sessions
  try {
    // Get the BrowserManager instance - this is a singleton
    const browserManager = (globalThis as any).__BROWSER_MANAGER__ as
      | BrowserManager
      | undefined;
    if (browserManager) {
      console.log('Closing all browser sessions...');
      await browserManager.closeAllSessions();
    }
  } catch (error) {
    console.error('Error closing browser sessions:', error);
  }

  // 2. Clean up shell processes
  try {
    if (processStates.size > 0) {
      console.log(`Terminating ${processStates.size} shell processes...`);
      for (const [id, state] of processStates.entries()) {
        if (!state.state.completed) {
          console.log(`Terminating process ${id}...`);
          try {
            state.process.kill('SIGTERM');
            // Force kill after a short timeout if still running
            setTimeout(() => {
              try {
                if (!state.state.completed) {
                  state.process.kill('SIGKILL');
                }
              } catch (e) {
                // Ignore errors on forced kill
              }
            }, 500);
          } catch (e) {
            console.error(`Error terminating process ${id}:`, e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error terminating shell processes:', error);
  }

  // 3. Give async operations a moment to complete
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log('Cleanup completed');
}
```

### 5. Add Necessary Imports

Add the required imports to each file:

```typescript
// In packages/agent/src/core/backgroundTools.ts
import { BrowserManager } from '../tools/browser/BrowserManager.js';
import { processStates } from '../tools/system/shellStart.js';
import { agentStates } from '../tools/interaction/agentStart.js';

// In packages/cli/src/utils/cleanup.ts
import { agentStates } from 'mycoder-agent/dist/tools/interaction/agentStart.js';
```

## Testing Plan

1. **Unit Tests**:
   - Add unit tests for the new `cleanup` method in `BackgroundTools`
   - Test cleanup with various combinations of tools (browsers, shells, agents)
   - Test cleanup with error scenarios

2. **Integration Tests**:
   - Test agent completion with resource cleanup
   - Test agent termination with resource cleanup
   - Test agent error handling with resource cleanup

3. **Manual Testing**:
   - Create complex agent hierarchies and verify all resources are cleaned up
   - Test with real browser sessions and shell processes
   - Verify no resource leaks under various scenarios

## Potential Challenges

1. **Circular Dependencies**: The imports might create circular dependencies that need to be resolved
2. **Race Conditions**: Ensure cleanup doesn't interfere with ongoing operations
3. **Error Handling**: Robust error handling is needed to prevent cascading failures
4. **Timing Issues**: Some cleanup operations are asynchronous and need proper timing

## Fallback Mechanisms

1. Keep the global cleanup as a fallback for any resources that weren't properly cleaned up
2. Add logging to identify cleanup failures for debugging
3. Implement timeout mechanisms to prevent cleanup operations from hanging

## Conclusion

This implementation plan provides a comprehensive approach to incremental resource cleanup tied to agent lifecycles. It ensures that resources are cleaned up promptly when they're no longer needed, rather than waiting for application exit, while maintaining backward compatibility and adding robust error handling.