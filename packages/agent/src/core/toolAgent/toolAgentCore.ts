import { zodToJsonSchema } from 'zod-to-json-schema';

import { utilityTools } from '../../tools/utility/index.js';
import { generateText } from '../llm/core.js';
import { createProvider } from '../llm/provider.js';
import { Message, ToolUseMessage } from '../llm/types.js';
import { Tool, ToolContext } from '../types.js';

import { AgentConfig } from './config.js';
import { generateStatusUpdate } from './statusUpdates.js';
import { logTokenUsage } from './tokenTracking.js';
import { executeTools } from './toolExecutor.js';
import { ToolAgentResult } from './types.js';

// Import the utility tools including compactHistory

// Import from our new LLM abstraction instead of Vercel AI SDK

/**
 * Main tool agent function that orchestrates the conversation with the AI
 * and handles tool execution
 */
export const toolAgent = async (
  initialPrompt: string,
  tools: Tool[],
  config: AgentConfig,
  context: ToolContext,
): Promise<ToolAgentResult> => {
  const { logger, tokenTracker } = context;

  logger.debug('Starting agent execution');
  logger.debug('Initial prompt:', initialPrompt);

  let interactions = 0;

  // Create messages using our new Message type
  const messages: Message[] = [
    {
      role: 'user',
      content: initialPrompt,
    },
  ];

  logger.debug('User message:', initialPrompt);

  const localContext = {
    ...context,
  };

  // Get the system prompt once at the start
  const systemPrompt = config.getSystemPrompt(localContext);

  // Create the LLM provider
  const provider = createProvider(localContext.provider, localContext.model, {
    baseUrl: context.baseUrl,
    apiKey: context.apiKey,
  });

  // Add the utility tools to the tools array
  const allTools = [...tools, ...utilityTools];

  // Variables for status updates
  let statusUpdateCounter = 0;
  const STATUS_UPDATE_FREQUENCY = 5; // Send status every 5 iterations by default
  const TOKEN_USAGE_THRESHOLD = 50; // Send status update when usage is above 50%

  for (let i = 0; i < config.maxIterations; i++) {
    logger.debug(
      `Requesting completion ${i + 1} with ${messages.length} messages with ${
        JSON.stringify(messages).length
      } bytes`,
    );

    interactions++;

    // Check for messages from parent agent
    // This assumes the context has an agentTracker and the current agent's ID
    if (context.agentTracker && context.currentAgentId) {
      const agentState = context.agentTracker.getAgentState(
        context.currentAgentId,
      );

      // Process any new parent messages
      if (
        agentState &&
        agentState.parentMessages &&
        agentState.parentMessages.length > 0
      ) {
        // Get all parent messages and clear the queue
        const parentMessages = [...agentState.parentMessages];
        agentState.parentMessages = [];

        // Add each message to the conversation
        for (const message of parentMessages) {
          logger.log(`Message from parent agent: ${message}`);
          messages.push({
            role: 'user',
            content: `[Message from parent agent]: ${message}`,
          });
        }
      }
    }

    // Check for messages from user (for main agent only)
    // Import this at the top of the file
    try {
      // Dynamic import to avoid circular dependencies
      const { userMessages } = await import(
        '../../tools/interaction/userMessage.js'
      );

      if (userMessages && userMessages.length > 0) {
        // Get all user messages and clear the queue
        const pendingUserMessages = [...userMessages];
        userMessages.length = 0;

        // Add each message to the conversation
        for (const message of pendingUserMessages) {
          logger.info(`Message from user: ${message}`);
          messages.push({
            role: 'user',
            content: `[Correction from user]: ${message}`,
          });
        }
      }
    } catch (error) {
      logger.debug('Error checking for user messages:', error);
    }

    // Convert tools to function definitions
    const functionDefinitions = allTools.map((tool) => ({
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
      temperature: localContext.temperature,
      maxTokens: localContext.maxTokens,
    };

    const { text, toolCalls, tokenUsage, totalTokens, contextWindow } =
      await generateText(provider, generateOptions);

    tokenTracker.tokenUsage.add(tokenUsage);

    // Send status updates based on frequency and token usage threshold
    statusUpdateCounter++;
    if (totalTokens) {
      let statusTriggered = false;
      statusTriggered ||= statusUpdateCounter >= STATUS_UPDATE_FREQUENCY;

      if (contextWindow) {
        const usagePercentage = Math.round((totalTokens / contextWindow) * 100);
        statusTriggered ||= usagePercentage >= TOKEN_USAGE_THRESHOLD;
      }

      // Send status update if either condition is met
      if (statusTriggered) {
        statusUpdateCounter = 0;

        const statusMessage = generateStatusUpdate(
          totalTokens,
          contextWindow,
          tokenTracker,
          localContext,
        );

        messages.push(statusMessage);
        logger.debug(`Sent status update to agent`);
      }
    }

    if (!text.length && toolCalls.length === 0) {
      // Only consider it empty if there's no text AND no tool calls
      logger.debug(
        'Received truly empty response from agent (no text and no tool calls), sending reminder',
      );
      messages.push({
        role: 'user',
        content:
          'I notice you sent an empty response. If you are done with your tasks, please call the agentDone tool with your results. If you are waiting for other tools to complete, you can use the sleep tool to wait before checking again.',
      });
      continue;
    }

    // Add the assistant's text response to messages
    if (text) {
      messages.push({
        role: 'assistant',
        content: text,
      });
      logger.log(text);
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
      const { agentDoned, completionResult } = await executeTools(
        toolCalls,
        allTools,
        messages,
        localContext,
      );

      if (agentDoned) {
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
