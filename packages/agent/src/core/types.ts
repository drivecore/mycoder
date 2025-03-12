import { z } from 'zod';
import { JsonSchema7Type } from 'zod-to-json-schema';

import { Logger } from '../utils/logger.js';

import { TokenTracker } from './tokens.js';
import { ModelProvider } from './toolAgent/config.js';

export type TokenLevel = 'debug' | 'verbose' | 'info' | 'warn' | 'error';

export type pageFilter = 'simple' | 'none' | 'readability';

export type ToolContext = {
  logger: Logger;
  workingDirectory: string;
  headless: boolean;
  userSession: boolean;
  pageFilter: pageFilter;
  tokenTracker: TokenTracker;
  githubMode: boolean;
  customPrompt?: string;
  tokenCache?: boolean;
  userPrompt?: boolean;
  agentId?: string; // Unique identifier for the agent, used for background tool tracking
  provider: ModelProvider;
  model: string;
  maxTokens: number;
  temperature: number;
};

export type Tool<TParams = Record<string, any>, TReturn = any> = {
  name: string;
  description: string;
  parameters: z.ZodType<TParams>;
  returns: z.ZodType<TReturn>;
  logPrefix?: string;

  logParameters?: (params: TParams, context: ToolContext) => void;
  logReturns?: (returns: TReturn, context: ToolContext) => void;

  execute: (params: TParams, context: ToolContext) => Promise<TReturn>;

  // Keep JsonSchema7Type for backward compatibility and Vercel AI SDK integration
  parametersJsonSchema?: JsonSchema7Type;
  returnsJsonSchema?: JsonSchema7Type;
};

export type ToolCall = {
  id: string;
  name: string;
  content: string;
};

export type TextContent = {
  type: 'text';
  text: string;
};

export type ToolUseContent = {
  type: 'tool_use';
} & ToolCall;

export type AssistantMessage = {
  role: 'assistant';
  content: (TextContent | ToolUseContent)[];
};

export type ToolResultContent = {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error: boolean;
};

export type UserMessage = {
  role: 'user';
  content: (TextContent | ToolResultContent)[];
};

export type Message = AssistantMessage | UserMessage;
