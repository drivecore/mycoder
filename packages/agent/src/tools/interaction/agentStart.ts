import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { BackgroundToolStatus } from '../../core/backgroundTools.js';
import {
  getDefaultSystemPrompt,
  AgentConfig,
} from '../../core/toolAgent/config.js';
import { toolAgent } from '../../core/toolAgent/toolAgentCore.js';
import { Tool, ToolContext } from '../../core/types.js';
import { getTools } from '../getTools.js';

import { AgentStatus, agentTracker, AgentState } from './agentTracker.js';

// For backward compatibility
export const agentStates = new Map<string, AgentState>();

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
  instanceId: z.string().describe('The ID of the started agent process'),
  status: z.string().describe('The initial status of the agent'),
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
    const { logger, backgroundTools } = context;

    // Validate parameters
    const {
      description,
      goal,
      projectContext,
      workingDirectory,
      relevantFilesDirectories,
      userPrompt = false,
    } = parameterSchema.parse(params);

    // Register this agent with the agent tracker
    const instanceId = agentTracker.registerAgent(goal);

    // For backward compatibility, also register with background tools
    backgroundTools.registerAgent(goal);

    logger.verbose(`Registered agent with ID: ${instanceId}`);

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

    // Store the agent state
    const agentState: AgentState = {
      id: instanceId,
      goal,
      prompt,
      output: '',
      completed: false,
      context: { ...context },
      workingDirectory: workingDirectory ?? context.workingDirectory,
      tools,
      aborted: false,
    };

    // Register agent state with the tracker
    agentTracker.registerAgentState(instanceId, agentState);

    // For backward compatibility
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
        const state = agentTracker.getAgentState(instanceId);
        if (state && !state.aborted) {
          state.completed = true;
          state.result = result;
          state.output = result.result;

          // Update agent tracker with completed status
          agentTracker.updateAgentStatus(instanceId, AgentStatus.COMPLETED, {
            result:
              result.result.substring(0, 100) +
              (result.result.length > 100 ? '...' : ''),
          });

          // For backward compatibility
          backgroundTools.updateToolStatus(
            instanceId,
            BackgroundToolStatus.COMPLETED,
            {
              result:
                result.result.substring(0, 100) +
                (result.result.length > 100 ? '...' : ''),
            },
          );

          // Clean up resources when agent completes successfully
          await backgroundTools.cleanup();
        }
      } catch (error) {
        // Update agent state with the error
        const state = agentTracker.getAgentState(instanceId);
        if (state && !state.aborted) {
          state.completed = true;
          state.error = error instanceof Error ? error.message : String(error);

          // Update agent tracker with error status
          agentTracker.updateAgentStatus(instanceId, AgentStatus.ERROR, {
            error: error instanceof Error ? error.message : String(error),
          });

          // For backward compatibility
          backgroundTools.updateToolStatus(
            instanceId,
            BackgroundToolStatus.ERROR,
            {
              error: error instanceof Error ? error.message : String(error),
            },
          );

          // Clean up resources when agent encounters an error
          await backgroundTools.cleanup();
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
