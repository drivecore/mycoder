import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import {
  BackgroundTools,
  BackgroundToolStatus,
} from '../../core/backgroundTools.js';
import {
  getDefaultSystemPrompt,
  AgentConfig,
} from '../../core/toolAgent/config.js';
import { toolAgent } from '../../core/toolAgent/toolAgentCore.js';
import { Tool, ToolContext } from '../../core/types.js';
import { getTools } from '../getTools.js';

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
const subAgentConfig: AgentConfig = {
  maxIterations: 200,
  getSystemPrompt: (context: ToolContext) => {
    return [
      getDefaultSystemPrompt(context),
      'You are a focused AI sub-agent handling a specific task.',
      'You have access to the same tools as the main agent but should focus only on your assigned task.',
      'When complete, call the sequenceComplete tool with your results.',
      'Follow any specific conventions or requirements provided in the task context.',
      'Ask the main agent for clarification if critical information is missing.',
    ].join('\n');
  },
};

export const subAgentTool: Tool<Parameters, ReturnType> = {
  name: 'subAgent',
  description:
    'Creates a sub-agent that has access to all tools to solve a specific task',
  logPrefix: '🤖',
  parameters: parameterSchema,
  parametersJsonSchema: zodToJsonSchema(parameterSchema),
  returns: returnSchema,
  returnsJsonSchema: zodToJsonSchema(returnSchema),
  execute: async (params, context) => {
    const { logger, backgroundTools } = context;

    // Validate parameters
    const {
      description,
      goal,
      projectContext,
      workingDirectory,
      relevantFilesDirectories,
    } = parameterSchema.parse(params);

    // Register this sub-agent with the background tool registry
    const subAgentId = backgroundTools.registerAgent(goal);
    logger.verbose(`Registered sub-agent with ID: ${subAgentId}`);

    const localContext = {
      ...context,
      workingDirectory: workingDirectory ?? context.workingDirectory,
      backgroundTools: new BackgroundTools(`subAgent: ${goal}`),
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

    // Use the subAgentConfig
    const config: AgentConfig = {
      ...subAgentConfig,
    };

    try {
      const result = await toolAgent(prompt, tools, config, localContext);

      // Update background tool registry with completed status
      backgroundTools.updateToolStatus(
        subAgentId,
        BackgroundToolStatus.COMPLETED,
        {
          result:
            result.result.substring(0, 100) +
            (result.result.length > 100 ? '...' : ''),
        },
      );

      return { response: result.result };
    } catch (error) {
      // Update background tool registry with error status
      backgroundTools.updateToolStatus(subAgentId, BackgroundToolStatus.ERROR, {
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  },
  logParameters: (input, { logger }) => {
    logger.info(`Delegating task "${input.description}"`);
  },
  logReturns: () => {},
};
