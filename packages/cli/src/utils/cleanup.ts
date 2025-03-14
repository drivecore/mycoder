import { BrowserManager, shellTracker } from 'mycoder-agent';
import { agentStates } from 'mycoder-agent/dist/tools/interaction/agentStart.js';

/**
 * Handles cleanup of resources before application exit
 * Ensures all browser sessions and shell processes are terminated
 */
export async function cleanupResources(): Promise<void> {
  console.log('Cleaning up resources before exit...');

  // First attempt to clean up any still-running agents
  // This will cascade to their browser sessions and shell processes
  try {
    // Find all active agent instances
    const activeAgents = Array.from(agentStates.entries()).filter(
      ([_, state]) => !state.completed && !state.aborted,
    );

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
    const browserManager = (
      globalThis as unknown as { __BROWSER_MANAGER__?: BrowserManager }
    ).__BROWSER_MANAGER__;
    if (browserManager) {
      console.log('Closing all browser sessions...');
      await browserManager.closeAllSessions();
    }
  } catch (error) {
    console.error('Error closing browser sessions:', error);
  }

  // 2. Clean up shell processes
  try {
    const runningShells = shellTracker.getShells();
    if (runningShells.length > 0) {
      console.log(`Terminating ${runningShells.length} shell processes...`);
      await shellTracker.cleanupAllShells();
    }
  } catch (error) {
    console.error('Error terminating shell processes:', error);
  }

  // 3. Give async operations a moment to complete
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log('Cleanup completed');
}

/**
 * Force exits the process after a timeout
 * This is a failsafe to ensure the process exits even if there are lingering handles
 */
export function setupForceExit(timeoutMs = 5000): void {
  setTimeout(() => {
    console.log(`Forcing exit after ${timeoutMs}ms timeout`);
    process.exit(0);
  }, timeoutMs);
}
