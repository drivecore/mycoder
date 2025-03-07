/**
 * Core message types for LLM interactions
 */

/**
 * Base message type with role and content
 */
export interface BaseMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
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
export interface ToolMessage extends BaseMessage {
  role: 'tool';
  name: string; // Tool name is required for tool messages
}

/**
 * Union type for all message types
 */
export type Message = SystemMessage | UserMessage | AssistantMessage | ToolMessage;

/**
 * Function/Tool definition for LLM
 */
export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>; // JSON Schema object
}

/**
 * Tool call made by the model
 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: string; // JSON string of arguments
}

/**
 * Response from LLM with text and/or tool calls
 */
export interface LLMResponse {
  text: string;
  toolCalls: ToolCall[];
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