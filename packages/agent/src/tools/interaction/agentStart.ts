import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import {
  getDefaultSystemPrompt,
  getModel,
} from '../../core/toolAgent/config.js';
import { toolAgent } from '../../core/toolAgent/toolAgentCore.js';
import { ToolAgentResult } from '../../core/toolAgent/types.js';
import { Tool, ToolContext } from '../../core/types.js';
import { getTools } from '../getTools.js';

// Define AgentState type
type AgentState = {
  goal: string;
  prompt: string;
  output: string;
  completed: boolean;
  error?: string;
  result?: ToolAgentResult;
  context: ToolContext;
  workingDirectory: string;
  tools: Tool[];
  aborted: boolean;
};

// Global map to store agent state
export const agentStates: Map<string, AgentState> = new Map();

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
  enableUserPrompt: z
    .boolean()
    .optional()
    .describe(
      'Whether to allow the sub-agent to use the userPrompt tool (default: false)',
    ),
});

const returnSchema = z.object({
  instanceId: z.string().describe('The ID of the started agent process'),
  status: z.string().describe('The initial status of the agent'),
});

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

// Sub-agent specific configuration
const subAgentConfig = {
  maxIterations: 200,
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
    // Validate parameters
    const {
      description,
      goal,
      projectContext,
      workingDirectory,
      relevantFilesDirectories,
      enableUserPrompt = false,
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

    const tools = getTools({ enableUserPrompt });

    // Create an instance ID
    const instanceId = uuidv4();

    // Store the agent state
    const agentState: AgentState = {
      goal,
      prompt,
      output: '',
      completed: false,
      context: { ...context },
      workingDirectory: workingDirectory ?? context.workingDirectory,
      tools,
      aborted: false,
    };

    agentStates.set(instanceId, agentState);

    // Start the agent in a separate promise that we don't await
    // eslint-disable-next-line promise/catch-or-return
    Promise.resolve().then(async () => {
      try {
        const result = await toolAgent(prompt, tools, subAgentConfig, {
          ...context,
          workingDirectory: workingDirectory ?? context.workingDirectory,
        });

        // Update agent state with the result
        const state = agentStates.get(instanceId);
        if (state && !state.aborted) {
          state.completed = true;
          state.result = result;
          state.output = result.result;
        }
      } catch (error) {
        // Update agent state with the error
        const state = agentStates.get(instanceId);
        if (state && !state.aborted) {
          state.completed = true;
          state.error = error instanceof Error ? error.message : String(error);
        }
      }
      return true;
    });

    return {
      instanceId,
      status: 'Agent started successfully',
    };
  },
  logParameters: (input, { logger }) => {
    logger.info(`Starting sub-agent for task "${input.description}"`);
  },
  logReturns: (output, { logger }) => {
    logger.info(`Sub-agent started with instance ID: ${output.instanceId}`);
  },
};
