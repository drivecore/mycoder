import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { getModel } from '../../core/toolAgent/config.js';
import { getDefaultSystemPrompt } from '../../core/toolAgent/index.js';
import { toolAgent } from '../../core/toolAgent.js';
import { Tool, ToolContext } from '../../core/types.js';
import { getTools } from '../getTools.js';

const parameterSchema = z.object({
  description: z
    .string()
    .max(80)
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
const subAgentConfig = {
  maxIterations: 50,
  model: getModel('anthropic', 'claude-3-7-sonnet-20250219'),
  maxTokens: 4096,
  temperature: 0.7,
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
    // Validate parameters
    const {
      description,
      goal,
      projectContext,
      workingDirectory,
      relevantFilesDirectories,
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

    const tools = getTools().filter((tool) => tool.name !== 'userPrompt');

    // Update config if timeout is specified
    const config = {
      ...subAgentConfig,
    };

    const result = await toolAgent(prompt, tools, config, {
      ...context,
      workingDirectory: workingDirectory ?? context.workingDirectory,
    });
    return { response: result.result };
  },
  logParameters: (input, { logger }) => {
    logger.info(`Delegating task "${input.description}"`);
  },
  logReturns: () => {},
};
