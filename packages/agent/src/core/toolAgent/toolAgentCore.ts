import { zodToJsonSchema } from 'zod-to-json-schema';

import { generateText } from '../llm/core.js';
import { Message, ToolUseMessage } from '../llm/types.js';

import { DEFAULT_CONFIG } from './config.js';
import { logTokenUsage } from './tokenTracking.js';
import { executeTools } from './toolExecutor.js';
import { Tool, ToolAgentResult, ToolContext } from './types.js';

// Import from our new LLM abstraction instead of Vercel AI SDK

/**
 * Main tool agent function that orchestrates the conversation with the AI
 * and handles tool execution
 */
export const toolAgent = async (
  initialPrompt: string,
  tools: Tool[],
  config = DEFAULT_CONFIG,
  context: ToolContext,
): Promise<ToolAgentResult> => {
  const { logger, tokenTracker } = context;

  logger.verbose('Starting agent execution');
  logger.verbose('Initial prompt:', initialPrompt);

  let interactions = 0;

  // Create messages using our new Message type
  const messages: Message[] = [
    {
      role: 'user',
      content: initialPrompt,
    },
  ];

  logger.debug('User message:', initialPrompt);

  // Get the system prompt once at the start
  const systemPrompt = config.getSystemPrompt(context);

  // Create the LLM provider
  const provider = config.model;

  for (let i = 0; i < config.maxIterations; i++) {
    logger.verbose(
      `Requesting completion ${i + 1} with ${messages.length} messages with ${
        JSON.stringify(messages).length
      } bytes`,
    );

    interactions++;

    // Convert tools to function definitions
    const functionDefinitions = tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parametersJsonSchema || zodToJsonSchema(tool.parameters),
    }));

    // Prepare the messages for the LLM, including the system message
    const messagesWithSystem: Message[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...messages,
    ];

    // Generate text using our new LLM abstraction
    const generateOptions = {
      messages: messagesWithSystem,
      functions: functionDefinitions,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    };

    const { text, toolCalls } = await generateText(provider, generateOptions);

    if (!text.length && toolCalls.length === 0) {
      // Only consider it empty if there's no text AND no tool calls
      logger.verbose(
        'Received truly empty response from agent (no text and no tool calls), sending reminder',
      );
      messages.push({
        role: 'user',
        content:
          'I notice you sent an empty response. If you are done with your tasks, please call the sequenceComplete tool with your results. If you are waiting for other tools to complete, you can use the sleep tool to wait before checking again.',
      });
      continue;
    }

    // Add the assistant's text response to messages
    if (text) {
      messages.push({
        role: 'assistant',
        content: text,
      });
      logger.info(text);
    }

    // Handle tool calls if any
    if (toolCalls.length > 0) {
      messages.push(
        ...toolCalls.map(
          (toolCall) =>
            ({
              role: 'tool_use',
              name: toolCall.name,
              id: toolCall.id,
              content: toolCall.content,
            }) satisfies ToolUseMessage,
        ),
      );

      // Execute the tools and get results
      const { sequenceCompleted, completionResult, respawn } =
        await executeTools(toolCalls, tools, messages, context);

      if (respawn) {
        logger.info('Respawning agent with new context');
        // Reset messages to just the new context
        messages.length = 0;
        messages.push({
          role: 'user',
          content: respawn.context,
        });
        continue;
      }

      if (sequenceCompleted) {
        const result: ToolAgentResult = {
          result: completionResult ?? 'Sequence explicitly completed',
          interactions,
        };
        logTokenUsage(tokenTracker);
        return result;
      }
    }
  }

  logger.warn('Maximum iterations reached');
  const result = {
    result: 'Maximum sub-agent iterations reach without successful completion',
    interactions,
  };

  logTokenUsage(tokenTracker);
  return result;
};
