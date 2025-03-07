// Import types from the core types file
import { Tool, ToolContext } from '../types.js';

// Export the imported types explicitly
export { Tool, ToolContext };

// Define types specific to toolAgent here
export interface ToolAgentResult {
  result: string;
  interactions: number;
}

export interface ToolCallResult {
  sequenceCompleted: boolean;
  completionResult?: string;
  toolResults: unknown[];
  respawn?: { context: string };
}

export type ErrorResult = {
  errorMessage: string;
  errorType: string;
};

export interface ToolAgentConfig {
  maxIterations: number;
  model: {
    provider: string;
    model: string;
    ollamaBaseUrl?: string;
  };
  maxTokens: number;
  temperature: number;
  getSystemPrompt: (context: ToolContext) => string;
  ollamaBaseUrl?: string;
}
