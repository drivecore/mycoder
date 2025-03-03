import { AnthropicStream, StreamingTextResponse, anthropic } from 'ai';
import { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages/messages.js';

import { getAnthropicApiKeyError } from '../../utils/errors.js';
import { Message, Tool, ToolContext, ToolUseContent } from '../types.js';
import { TokenUsage } from '../tokens.js';

import { LLMProvider, LLMProviderResponse } from './types.js';

function processResponse(content: any[]): {
  content: any[];
  toolCalls: ToolUseContent[];
} {
  const processedContent: any[] = [];
  const toolCalls: ToolUseContent[] = [];

  for (const message of content) {
    if (message.type === 'text') {
      processedContent.push({ type: 'text', text: message.text });
    } else if (message.type === 'tool_use') {
      const toolUse: ToolUseContent = {
        type: 'tool_use',
        name: message.name,
        id: message.id,
        input: message.input,
      };
      processedContent.push(toolUse);
      toolCalls.push(toolUse);
    }
  }

  return { content: processedContent, toolCalls };
}

// Helper function to add cache control to content blocks
function addCacheControlToContentBlocks(
  content: ContentBlockParam[],
): ContentBlockParam[] {
  return content.map((c, i) => {
    if (i === content.length - 1) {
      if (
        c.type === 'text' ||
        c.type === 'document' ||
        c.type === 'image' ||
        c.type === 'tool_use' ||
        c.type === 'tool_result' ||
        c.type === 'thinking' ||
        c.type === 'redacted_thinking'
      ) {
        return { ...c, cache_control: { type: 'ephemeral' } };
      }
    }
    return c;
  });
}

// Helper function to add cache control to messages
function addCacheControlToMessages(messages: any[]): any[] {
  return messages.map((m, i) => {
    if (typeof m.content === 'string') {
      return {
        ...m,
        content: [
          {
            type: 'text',
            text: m.content,
            cache_control: { type: 'ephemeral' },
          },
        ] as ContentBlockParam[],
      };
    }
    return {
      ...m,
      content:
        i >= messages.length - 2
          ? addCacheControlToContentBlocks(m.content)
          : m.content,
    };
  });
}

// Helper function to add cache control to tools
function addCacheControlToTools<T>(tools: T[]): T[] {
  return tools.map((t, i) => ({
    ...t,
    ...(i === tools.length - 1 ? { cache_control: { type: 'ephemeral' } } : {}),
  }));
}

export class AnthropicProvider implements LLMProvider {
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor({
    model = 'claude-3-7-sonnet-latest',
    maxTokens = 4096,
    temperature = 0.7,
  } = {}) {
    this.model = model;
    this.maxTokens = maxTokens;
    this.temperature = temperature;
  }

  async sendRequest({
    systemPrompt,
    messages,
    tools,
    context,
  }: {
    systemPrompt: string;
    messages: Message[];
    tools: Tool[];
    context: ToolContext;
  }): Promise<LLMProviderResponse> {
    const { logger, tokenTracker } = context;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error(getAnthropicApiKeyError());

    // Using Vercel AI SDK to create Anthropic client
    const client = anthropic({
      apiKey,
    });

    logger.verbose(
      `Requesting completion with ${messages.length} messages with ${JSON.stringify(messages).length} bytes`,
    );

    // Create request parameters
    const response = await client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      messages: addCacheControlToMessages(messages),
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      tools: addCacheControlToTools(
        tools.map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: t.parameters,
        })),
      ),
      tool_choice: { type: 'auto' },
    });

    if (!response.content.length) {
      return { content: [], toolCalls: [] };
    }

    // Track token usage
    const tokenUsagePerMessage = TokenUsage.fromMessage(response);
    tokenTracker.tokenUsage.add(tokenUsagePerMessage);

    return processResponse(response.content);
  }
}
