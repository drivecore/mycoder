/**
 * Core message types for LLM interactions
 */

import { JsonSchema7Type } from 'zod-to-json-schema';

import { TokenUsage } from '../tokens';
import { ToolCall } from '../types';

/**
 * Base message type with role and content
 */
export interface BaseMessage {
  role: 'system' | 'user' | 'assistant' | 'tool_use' | 'tool_result';
  content: string;
  name?: string;
}

/**
 * System message for providing instructions to the model
 */
export interface SystemMessage extends BaseMessage {
  role: 'system';
}

/**
 * User message for representing human input
 */
export interface UserMessage extends BaseMessage {
  role: 'user';
}

/**
 * Assistant message for representing AI responses
 */
export interface AssistantMessage extends BaseMessage {
  role: 'assistant';
}

/**
 * Tool message for representing tool responses
 */
export interface ToolUseMessage extends BaseMessage {
  role: 'tool_use';
  name: string; // Tool name is required for tool messages
  id: string; // Tool ID is required for tool messages
  content: string; // the arguments in string form, but JSON
}

export interface ToolResultMessage extends BaseMessage {
  role: 'tool_result';
  tool_use_id: string; // Tool Use ID is required for tool messages
  content: string; // the results in string form, but JSON
  is_error: boolean; // whether the tool call was successful
}

/**
 * Union type for all message types
 */
export type Message =
  | SystemMessage
  | UserMessage
  | AssistantMessage
  | ToolUseMessage
  | ToolResultMessage;

/**
 * Function/Tool definition for LLM
 */
export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: JsonSchema7Type; // JSON Schema object
}

/**
 * Response from LLM with text and/or tool calls
 */
export interface LLMResponse {
  text: string;
  toolCalls: ToolCall[];
  tokenUsage: TokenUsage;
}

/**
 * Options for LLM generation
 */
export interface GenerateOptions {
  messages: Message[];
  functions?: FunctionDefinition[];
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  responseFormat?: 'text' | 'json_object';
}

/**
 * Provider-specific options
 */
export interface ProviderOptions {
  apiKey?: string;
  baseUrl?: string;
  organization?: string;
  [key: string]: any; // Allow for provider-specific options
}
