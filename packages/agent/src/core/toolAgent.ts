import { execSync } from 'child_process';

import chalk from 'chalk';

import { AnthropicProvider } from './llm/anthropic.js';
import { LLMProvider } from './llm/types.js';
import { executeToolCall } from './executeToolCall.js';
import { TokenTracker } from './tokens.js';
import {
  Tool,
  TextContent,
  ToolUseContent,
  ToolResultContent,
  Message,
  ToolContext,
} from './types.js';

export interface ToolAgentResult {
  result: string;
  interactions: number;
}

const CONFIG = {
  maxIterations: 200,
  model: 'claude-3-7-sonnet-latest',
  maxTokens: 4096,
  temperature: 0.7,
  getSystemPrompt: () => {
    // Gather context with error handling
    const getCommandOutput = (command: string, label: string): string => {
      try {
        return execSync(command).toString().trim();
      } catch (error) {
        return `[Error getting ${label}: ${(error as Error).message}]`;
      }
    };

    const context = {
      pwd: getCommandOutput('pwd', 'current directory'),
      files: getCommandOutput('ls -la', 'file listing'),
      system: getCommandOutput('uname -a', 'system information'),
      datetime: new Date().toString(),
    };

    return [
      'You are an AI agent that can use tools to accomplish tasks.',
      '',
      'Current Context:',
      `Directory: ${context.pwd}`,
      'Files:',
      context.files,
      `System: ${context.system}`,
      `DateTime: ${context.datetime}`,
      '',
      'You prefer to call tools in parallel when possible because it leads to faster execution and less resource usage.',
      'When done, call the sequenceComplete tool with your results to indicate that the sequence has completed.',
      '',
      'For coding tasks:',
      '0. Try to break large tasks into smaller sub-tasks that can be completed and verified sequentially.',
      "   - trying to make lots of changes in one go can make it really hard to identify when something doesn't work",
      '   - use sub-agents for each sub-task, leaving the main agent in a supervisory role',
      '   - when possible ensure the project compiles/builds and the tests pass after each sub-task',
      '   - give the sub-agents the guidance and context necessary be successful',
      '1. First understand the context by:',
      '   - Reading README.md, CONTRIBUTING.md, and similar documentation',
      '   - Checking project configuration files (e.g., package.json)',
      '   - Understanding coding standards',
      '2. Ensure changes:',
      '   - Follow project conventions',
      '   - Build successfully',
      '   - Pass all tests',
      '3. Update documentation as needed',
      '4. Consider adding documentation if you encountered setup/understanding challenges',
      '',
      'Feel free to use Google and Bing via the browser tools to search for information or for ideas when you get stuck.',
      '',
      'When you run into issues or unexpected results, take a step back and read the project documentation and configuration files and look at other source files in the project for examples of what works.',
      '',
      'Use sub-agents for parallel tasks, providing them with specific context they need rather than having them rediscover it.',
    ].join('\n');
  },
};

interface ToolCallResult {
  sequenceCompleted: boolean;
  completionResult?: string;
  toolResults: ToolResultContent[];
}

async function executeTools(
  toolCalls: ToolUseContent[],
  tools: Tool[],
  messages: Message[],
  context: ToolContext,
): Promise<ToolCallResult & { respawn?: { context: string } }> {
  if (toolCalls.length === 0) {
    return { sequenceCompleted: false, toolResults: [] };
  }

  const { logger } = context;

  logger.verbose(`Executing ${toolCalls.length} tool calls`);

  // Check for respawn tool call
  const respawnCall = toolCalls.find((call) => call.name === 'respawn');
  if (respawnCall) {
    return {
      sequenceCompleted: false,
      toolResults: [
        {
          type: 'tool_result',
          tool_use_id: respawnCall.id,
          content: 'Respawn initiated',
        },
      ],
      respawn: {
        context: respawnCall.input.respawnContext,
      },
    };
  }

  const results = await Promise.all(
    toolCalls.map(async (call) => {
      let toolResult = '';
      try {
        toolResult = await executeToolCall(call, tools, {
          ...context,
          tokenTracker: new TokenTracker(call.name, context.tokenTracker),
        });
      } catch (error: any) {
        toolResult = `Error: Exception thrown during tool execution.  Type: ${error.constructor.name}, Message: ${error.message}`;
      }
      return {
        type: 'tool_result' as const,
        tool_use_id: call.id,
        content: toolResult,
        isComplete: call.name === 'sequenceComplete',
      };
    }),
  );

  const toolResults = results.map(({ type, tool_use_id, content }) => ({
    type,
    tool_use_id,
    content,
  }));

  const sequenceCompleted = results.some((r) => r.isComplete);
  const completionResult = results.find((r) => r.isComplete)?.content;

  messages.push({
    role: 'user',
    content: toolResults,
  });

  if (sequenceCompleted) {
    logger.verbose('Sequence completed', { completionResult });
  }

  return { sequenceCompleted, completionResult, toolResults };
}

export const toolAgent = async (
  initialPrompt: string,
  tools: Tool[],
  config = CONFIG,
  context: ToolContext,
): Promise<ToolAgentResult> => {
  const { logger, tokenTracker } = context;

  logger.verbose('Starting agent execution');
  logger.verbose('Initial prompt:', initialPrompt);

  let interactions = 0;

  // Create LLM provider
  const llmProvider: LLMProvider = new AnthropicProvider({
    model: config.model,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
  });

  const messages: Message[] = [
    {
      role: 'user',
      content: [{ type: 'text', text: initialPrompt }],
    },
  ];

  logger.debug('User message:', initialPrompt);

  // Get the system prompt once at the start
  const systemPrompt = config.getSystemPrompt();

  for (let i = 0; i < config.maxIterations; i++) {
    logger.verbose(
      `Requesting completion ${i + 1} with ${messages.length} messages with ${
        JSON.stringify(messages).length
      } bytes`,
    );

    interactions++;

    // Request completion from LLM provider
    const { content, toolCalls } = await llmProvider.sendRequest({
      systemPrompt,
      messages,
      tools,
      context,
    });

    if (!content.length) {
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
      content,
    });

    // Log the assistant's message
    const assistantMessage = content
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('\n');
    if (assistantMessage) {
      logger.info(assistantMessage);
    }

    logger.log(
      tokenTracker.logLevel,
      chalk.blue(`[Token Usage/Message] ${tokenTracker.tokenUsage.toString()}`),
    );

    const { sequenceCompleted, completionResult, respawn } = await executeTools(
      toolCalls,
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
      const result = {
        result:
          completionResult ??
          'Sequence explicitly completed with an empty result',
        interactions,
      };
      logger.log(
        tokenTracker.logLevel,
        chalk.blueBright(`[Token Usage/Agent] ${tokenTracker.toString()}`),
      );
      return result;
    }
  }

  logger.warn('Maximum iterations reached');
  const result = {
    result: 'Maximum sub-agent iterations reach without successful completion',
    interactions,
  };
  // Use the appropriate log level based on tokenUsage flag
  logger.log(
    tokenTracker.logLevel,
    chalk.blueBright(`[Token Usage/Agent] ${tokenTracker.toString()}`),
  );
  return result;
};
