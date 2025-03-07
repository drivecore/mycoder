import { LLMInterface } from 'llm-interface';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { DEFAULT_CONFIG } from './config.js';
import {
  CoreMessage,
  convertToLLMInterfaceMessages,
  createCacheControlMessageFromSystemPrompt,
  addCacheControlToMessages,
} from './messageUtils.js';
import { logTokenUsage } from './tokenTracking.js';
import { executeTools } from './toolExecutor.js';
import {
  Tool,
  ToolAgentResult,
  ToolContext,
  ToolAgentConfig,
} from './types.js';

/**
 * Main tool agent function that orchestrates the conversation with the AI
 * and handles tool execution
 */
export const toolAgent = async (
  initialPrompt: string,
  tools: Tool[],
  config: ToolAgentConfig = DEFAULT_CONFIG,
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

    // Convert tools to the format expected by llm-interface
    const toolDefinitions = tools.map((tool) => {
      const schema = zodToJsonSchema(tool.parameters);
      return {
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: schema,
        },
      };
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

    // Convert messages to the format expected by llm-interface
    const llmMessages = convertToLLMInterfaceMessages(messagesWithCacheControl);

    try {
      // Call the LLM using llm-interface
      const modelOptions: any = {
        messages: llmMessages,
        tools: toolDefinitions,
        model: config.model.model,
      };

      // Add ollamaBaseUrl for Ollama provider if available
      if (
        config.model.provider.startsWith('ollama') &&
        (config.model.ollamaBaseUrl || config.ollamaBaseUrl)
      ) {
        modelOptions.ollamaBaseUrl =
          config.model.ollamaBaseUrl || config.ollamaBaseUrl;
      }

      const response = await LLMInterface.sendMessage(
        config.model.provider,
        modelOptions,
        {
          max_tokens: config.maxTokens,
          temperature: config.temperature,
        },
      );

      // Extract text and tool calls from the response
      const text = response.results || '';
      const toolCalls = response.toolCalls || [];

      // Format tool calls to match our expected format
      const localToolCalls = toolCalls.map((call) => ({
        type: 'tool_use',
        name: call.function?.name,
        id: call.id,
        input: JSON.parse(call.function?.arguments || '{}'),
      }));

      if (!text && toolCalls.length === 0) {
        // Only consider it empty if there's no text AND no tool calls
        logger.verbose(
          'Received truly empty response from agent (no text and no tool calls), sending reminder',
        );
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
        const toolCallParts = toolCalls.map((call) => ({
          type: 'tool-call',
          toolCallId: call.id,
          toolName: call.function?.name,
          args: JSON.parse(call.function?.arguments || '{}'),
        }));

        messages.push({
          role: 'assistant',
          content: toolCallParts,
        });
      }

      const { sequenceCompleted, completionResult, respawn } =
        await executeTools(localToolCalls, tools, messages, context);

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
    } catch (error: any) {
      logger.error('Error calling LLM:', error);
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: `There was an error calling the LLM: ${error.message || String(error)}. Please try again or call the sequenceComplete tool if you've completed your task.`,
          },
        ],
      });
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
