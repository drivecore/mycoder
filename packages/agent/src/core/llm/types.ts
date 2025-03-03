import { Tool, Message, ToolContext } from '../types.js';

export interface LLMProviderResponse {
  content: any[];
  toolCalls: any[];
}

export interface LLMProvider {
  /**
   * Sends a request to the LLM provider and returns the response
   */
  sendRequest({
    systemPrompt,
    messages,
    tools,
    context,
  }: {
    systemPrompt: string;
    messages: Message[];
    tools: Tool[];
    context: ToolContext;
  }): Promise<LLMProviderResponse>;
}
