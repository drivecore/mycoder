// Import types from the core types file

// Define types specific to toolAgent here
export interface ToolAgentResult {
  result: string;
  interactions: number;
}

export interface ToolCallResult {
  agentDoned: boolean;
  completionResult?: string;
  toolResults: unknown[];
  respawn?: { context: string };
}

export type ErrorResult = {
  errorMessage: string;
  errorType: string;
};
