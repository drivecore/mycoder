import { BrowserManager, processStates } from 'mycoder-agent';

/**
 * Handles cleanup of resources before application exit
 * Ensures all browser sessions and shell processes are terminated
 */
export async function cleanupResources(): Promise<void> {
  console.log('Cleaning up resources before exit...');

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
                // eslint-disable-next-line unused-imports/no-unused-vars
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
