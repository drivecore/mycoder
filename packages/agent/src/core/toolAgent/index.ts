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
