import { z } from 'zod';
import { JsonSchema7Type } from 'zod-to-json-schema';

import { AgentTracker } from '../tools/agent/AgentTracker.js';
import { SessionTracker } from '../tools/session/SessionTracker.js';
import { ShellTracker } from '../tools/shell/ShellTracker.js';
import { Logger } from '../utils/logger.js';

import { TokenTracker } from './tokens.js';
import { ModelProvider } from './toolAgent/config.js';

export type TokenLevel = 'debug' | 'info' | 'log' | 'warn' | 'error';

export type ContentFilter = 'raw' | 'smartMarkdown';

export type ToolContext = {
  logger: Logger;
  workingDirectory: string;
  headless: boolean;
  userSession: boolean;
  tokenTracker: TokenTracker;
  githubMode: boolean;
  customPrompt?: string | string[];
  userPrompt?: boolean;
  agentId?: string; // Unique identifier for the agent, used for background tool tracking
  agentName?: string; // Name of the agent, used for browser tracker
  currentAgentId?: string; // ID of the current agent, used for parent-to-subagent communication
  provider: ModelProvider;
  model?: string;
  baseUrl?: string;
  apiKey?: string;
  maxTokens: number;
  temperature: number;
  agentTracker: AgentTracker;
  shellTracker: ShellTracker;
  browserTracker: SessionTracker;
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
