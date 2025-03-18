import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import {
  getDefaultSystemPrompt,
  AgentConfig,
} from '../../core/toolAgent/config.js';
import { toolAgent } from '../../core/toolAgent/toolAgentCore.js';
import { Tool, ToolContext } from '../../core/types.js';
import { getTools } from '../getTools.js';
import { SessionTracker } from '../session/SessionTracker.js';
import { ShellTracker } from '../shell/ShellTracker.js';

import { AgentTracker } from './AgentTracker.js';

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
});

const returnSchema = z.object({
  response: z
    .string()
    .describe(
      'The response from the sub-agent including its reasoning and tool usage',
    ),
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

export const agentExecuteTool: Tool<Parameters, ReturnType> = {
  name: 'agentExecute',
  description:
    'Creates a sub-agent that has access to all tools to solve a specific task',
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
    } = parameterSchema.parse(params);

    // Register this sub-agent with the background tool registry
    const subAgentId = agentTracker.registerAgent(goal);
    logger.debug(`Registered sub-agent with ID: ${subAgentId}`);

    const localContext = {
      ...context,
      workingDirectory: workingDirectory ?? context.workingDirectory,
      agentTracker: new AgentTracker(subAgentId),
      shellTracker: new ShellTracker(subAgentId),
      browserTracker: new SessionTracker(subAgentId),
    };

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

    const tools = getTools({ userPrompt: false });

    // Use the agentConfig
    const config: AgentConfig = {
      ...agentConfig,
    };

    try {
      const result = await toolAgent(prompt, tools, config, localContext);

      // Update background tool registry with completed status

      return { response: result.result };
    } finally {
      await Promise.all([
        localContext.agentTracker.cleanup(),
        localContext.shellTracker.cleanup(),
        localContext.browserTracker.cleanup(),
      ]);
    }
  },
  logParameters: (input, { logger }) => {
    logger.log(`Delegating task "${input.description}"`);
  },
  logReturns: () => {},
};
