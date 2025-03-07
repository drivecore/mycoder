/**
 * LLM abstraction module
 */

// Export message types
export * from './types.js';

// Export core functionality
export * from './core.js';

// Export provider interface
export * from './provider.js';

// Export provider implementations
export * from './providers/openai.js';
export * from './providers/index.js';

// Re-export the main function for convenience
import { generateText } from './core.js';
export { generateText };