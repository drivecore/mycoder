import { CoreMessage, ToolSet, generateText, tool as makeTool } from 'ai';

import { DEFAULT_CONFIG } from './config.js';
import {
  addCacheControlToMessages,
  createCacheControlMessageFromSystemPrompt,
  createToolCallParts,
  formatToolCalls,
} from './messageUtils.js';
import { logTokenUsage } from './tokenTracking.js';
import { executeTools } from './toolExecutor.js';
import { Tool, ToolAgentResult, ToolContext } from './types.js';

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

  const messages: CoreMessage[] = [
    {
      role: 'user',
      content: [{ type: 'text', text: initialPrompt }],
    },
  ];

  logger.debug('User message:', initialPrompt);

  // Get the system prompt once at the start
  const systemPrompt = config.getSystemPrompt(context);

  for (let i = 0; i < config.maxIterations; i++) {
    logger.verbose(
      `Requesting completion ${i + 1} with ${messages.length} messages with ${
        JSON.stringify(messages).length
      } bytes`,
    );

    interactions++;

    const toolSet: ToolSet = {};
    tools.forEach((tool) => {
      toolSet[tool.name] = makeTool({
        description: tool.description,
        parameters: tool.parameters,
      });
    });

    // Apply cache control to messages for token caching if enabled
    const messagesWithCacheControl =
      tokenTracker.tokenCache !== false && context.tokenCache !== false
        ? [
            createCacheControlMessageFromSystemPrompt(systemPrompt),
            ...addCacheControlToMessages(messages),
          ]
        : [
            {
              role: 'system',
              content: systemPrompt,
            } as CoreMessage,
            ...messages,
          ];

    const generateTextProps = {
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      messages: messagesWithCacheControl,
      tools: toolSet,
    };
    const { text, toolCalls } = await generateText(generateTextProps);

    const localToolCalls = formatToolCalls(toolCalls);

    if (!text.length) {
      // Instead of treating empty response as completion, remind the agent
      logger.verbose('Received empty response from agent, sending reminder');
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'I notice you sent an empty response. If you are done with your tasks, please call the sequenceComplete tool with your results. If you are waiting for other tools to complete, you can use the sleep tool to wait before checking again.',
          },
        ],
      });
      continue;
    }

    messages.push({
      role: 'assistant',
      content: [{ type: 'text', text: text }],
    });

    if (text) {
      logger.info(text);
    }

    if (toolCalls.length > 0) {
      const toolCallParts = createToolCallParts(toolCalls);

      messages.push({
        role: 'assistant',
        content: toolCallParts,
      });
    }

    const { sequenceCompleted, completionResult, respawn } = await executeTools(
      localToolCalls,
      tools,
      messages,
      context,
    );

    if (respawn) {
      logger.info('Respawning agent with new context');
      // Reset messages to just the new context
      messages.length = 0;
      messages.push({
        role: 'user',
        content: [{ type: 'text', text: respawn.context }],
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

  logger.warn('Maximum iterations reached');
  const result = {
    result: 'Maximum sub-agent iterations reach without successful completion',
    interactions,
  };

  logTokenUsage(tokenTracker);
  return result;
};
