import chalk from 'chalk';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import {
  getDefaultSystemPrompt,
  AgentConfig,
} from '../../core/toolAgent/config.js';
import { toolAgent } from '../../core/toolAgent/toolAgentCore.js';
import { Tool, ToolContext } from '../../core/types.js';
import { LogLevel, Logger, LoggerListener } from '../../utils/logger.js';
import { getTools } from '../getTools.js';

import { AgentStatus } from './AgentTracker.js';

// Generate a random color for an agent
// Avoid colors that are too light or too similar to error/warning colors
const getRandomAgentColor = () => {
  // List of bright chalk colors that are visually distinct
  const colors = [
    chalk.cyan,
    chalk.green,
    chalk.blue,
    chalk.magenta,
    chalk.blueBright,
    chalk.greenBright,
    chalk.cyanBright,
    chalk.magentaBright,
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const parameterSchema = z.object({
  description: z
    .string()
    .describe("A brief description of the sub-agent's purpose (max 80 chars)"),
  goal: z
    .string()
    .describe('The main objective that the sub-agent needs to achieve'),
  projectContext: z
    .string()
    .describe('Context about the problem or environment'),
  workingDirectory: z
    .string()
    .optional()
    .describe('The directory where the sub-agent should operate'),
  relevantFilesDirectories: z
    .string()
    .optional()
    .describe('A list of files, which may include ** or * wildcard characters'),
  userPrompt: z
    .boolean()
    .optional()
    .describe(
      'Whether to allow the sub-agent to use the userPrompt tool (default: false)',
    ),
});

const returnSchema = z.object({
  agentId: z.string().describe('The ID of the started agent process'),
  status: z.string().describe('The initial status of the agent'),
});

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

// Sub-agent specific configuration
const agentConfig: AgentConfig = {
  maxIterations: 200,
  getSystemPrompt: (context: ToolContext) => {
    return [
      getDefaultSystemPrompt(context),
      'You are a focused AI sub-agent handling a specific task.',
      'You have access to the same tools as the main agent but should focus only on your assigned task.',
      'When complete, call the agentDone tool with your results.',
      'Follow any specific conventions or requirements provided in the task context.',
      'Ask the main agent for clarification if critical information is missing.',
    ].join('\n');
  },
};

export const agentStartTool: Tool<Parameters, ReturnType> = {
  name: 'agentStart',
  description:
    'Starts a sub-agent and returns an instance ID immediately for later interaction',
  logPrefix: '🤖',
  parameters: parameterSchema,
  parametersJsonSchema: zodToJsonSchema(parameterSchema),
  returns: returnSchema,
  returnsJsonSchema: zodToJsonSchema(returnSchema),
  execute: async (params, context) => {
    const { logger, agentTracker } = context;

    // Validate parameters
    const {
      description,
      goal,
      projectContext,
      workingDirectory,
      relevantFilesDirectories,
      userPrompt = false,
    } = parameterSchema.parse(params);

    // Construct a well-structured prompt
    const prompt = [
      `Description: ${description}`,
      `Goal: ${goal}`,
      `Project Context: ${projectContext}`,
      workingDirectory ? `Working Directory: ${workingDirectory}` : '',
      relevantFilesDirectories
        ? `Relevant Files:\n  ${relevantFilesDirectories}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    const tools = getTools({ userPrompt });

    // Add a logger listener to capture log, warn, and error level messages
    const capturedLogs: string[] = [];

    const logCaptureListener: LoggerListener = (logger, logLevel, lines) => {
      // Only capture log, warn, and error levels (not debug or info)
      if (
        logLevel === LogLevel.log ||
        logLevel === LogLevel.warn ||
        logLevel === LogLevel.error
      ) {
        // Only capture logs from the agent and its immediate tools (not deeper than that)
        // We can identify this by the nesting level of the logger
        if (logger.nesting <= 1) {
          const logPrefix =
            logLevel === LogLevel.warn
              ? '[WARN] '
              : logLevel === LogLevel.error
                ? '[ERROR] '
                : '';

          // Add each line to the capturedLogs array with logger name for context
          lines.forEach((line) => {
            const loggerPrefix =
              logger.name !== 'agent' ? `[${logger.name}] ` : '';
            capturedLogs.push(`${logPrefix}${loggerPrefix}${line}`);
          });
        }
      }
    };

    // Add the listener to the context logger
    context.logger.listeners.push(logCaptureListener);

    // Create a new logger specifically for the sub-agent if needed
    // This is wrapped in a try-catch to maintain backward compatibility with tests
    let subAgentLogger = context.logger;
    try {
      // Generate a random color for this agent
      const agentColor = getRandomAgentColor();

      subAgentLogger = new Logger({
        name: 'agent',
        parent: context.logger,
        color: agentColor, // Assign the random color to the agent
      });
      // Add the listener to the sub-agent logger as well
      subAgentLogger.listeners.push(logCaptureListener);
    } catch {
      // If Logger instantiation fails (e.g., in tests), fall back to using the context logger
      context.logger.debug(
        'Failed to create sub-agent logger, using context logger instead',
      );
    }

    // Register the agent with all the information we have
    const agentId = agentTracker.registerAgent({
      goal,
      prompt,
      output: '',
      capturedLogs,
      completed: false,
      context: { ...context },
      workingDirectory: workingDirectory ?? context.workingDirectory,
      tools,
      aborted: false,
      parentMessages: [],
    });

    logger.debug(`Registered agent with ID: ${agentId}`);

    // Start the agent in a separate promise that we don't await
    // eslint-disable-next-line promise/catch-or-return
    Promise.resolve().then(async () => {
      try {
        const result = await toolAgent(prompt, tools, agentConfig, {
          ...context,
          logger: subAgentLogger, // Use the sub-agent specific logger if available
          workingDirectory: workingDirectory ?? context.workingDirectory,
          currentAgentId: agentId, // Pass the agent's ID to the context
        });

        // Update agent with the result
        const agent = agentTracker.getAgent(agentId);
        if (agent && !agent.aborted) {
          agent.completed = true;
          agent.result_detailed = result;
          agent.output = result.result;

          // Update agent tracker with completed status
          agentTracker.updateAgentStatus(agentId, AgentStatus.COMPLETED, {
            result:
              result.result.substring(0, 100) +
              (result.result.length > 100 ? '...' : ''),
          });
        }
      } catch (error) {
        // Update agent with the error
        const agent = agentTracker.getAgent(agentId);
        if (agent && !agent.aborted) {
          agent.completed = true;
          agent.error = error instanceof Error ? error.message : String(error);

          // Update agent tracker with error status
          agentTracker.updateAgentStatus(agentId, AgentStatus.ERROR, {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      return true;
    });

    return {
      agentId,
      status: 'Agent started successfully',
    };
  },
  logParameters: (input, { logger }) => {
    logger.log(`Starting sub-agent for task "${input.description}"`);
  },
  logReturns: (output, { logger }) => {
    logger.log(`Sub-agent started with instance ID: ${output.agentId}`);
  },
};
