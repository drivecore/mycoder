/**
 * Main entry point for the toolAgent module
 * Re-exports all functionality from the modular structure
 */

// Export the main toolAgent function
export { toolAgent } from './toolAgentCore.js';

// Re-export everything from the module
export * from './config.js';
export * from './messageUtils.js';
export * from './toolExecutor.js';
export * from './tokenTracking.js';
export * from './types.js';

// Export default system prompt for convenience
export const getDefaultSystemPrompt = (context: Record<string, unknown>) => {
  return `You are an AI agent that can use tools to accomplish tasks.

Current Context:
Directory: ${context.workingDirectory}
Files:
${context.directoryListing ?? 'No directory listing available'}
System: ${context.systemInfo ?? 'No system info available'}
DateTime: ${new Date().toString()}`;
};
