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
