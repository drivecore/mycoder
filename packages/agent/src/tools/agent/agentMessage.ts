import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { Tool } from '../../core/types.js';

import { agentStates } from './agentStart.js';

const parameterSchema = z.object({
  instanceId: z.string().describe('The ID returned by agentStart'),
  guidance: z
    .string()
    .optional()
    .describe('Optional guidance or instructions to send to the sub-agent'),
  terminate: z
    .boolean()
    .optional()
    .describe('Whether to terminate the sub-agent (default: false)'),
  description: z
    .string()
    .describe('The reason for this agent interaction (max 80 chars)'),
});

const returnSchema = z.object({
  output: z.string().describe('The current output from the sub-agent'),
  completed: z
    .boolean()
    .describe('Whether the sub-agent has completed its task'),
  error: z
    .string()
    .optional()
    .describe('Error message if the sub-agent encountered an error'),
  terminated: z
    .boolean()
    .optional()
    .describe('Whether the sub-agent was terminated by this message'),
  messageSent: z
    .boolean()
    .optional()
    .describe('Whether a message was sent to the sub-agent'),
  messageCount: z
    .number()
    .optional()
    .describe("The number of messages in the sub-agent's queue"),
});

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

export const agentMessageTool: Tool<Parameters, ReturnType> = {
  name: 'agentMessage',
  description:
    'Interacts with a running sub-agent, getting its current state and optionally providing guidance',
  logPrefix: '🤖',
  parameters: parameterSchema,
  parametersJsonSchema: zodToJsonSchema(parameterSchema),
  returns: returnSchema,
  returnsJsonSchema: zodToJsonSchema(returnSchema),

  execute: async (
    { instanceId, guidance, terminate },
    { logger, ..._ },
  ): Promise<ReturnType> => {
    logger.verbose(
      `Interacting with sub-agent ${instanceId}${guidance ? ' with guidance' : ''}${terminate ? ' with termination request' : ''}`,
    );

    try {
      const agentState = agentStates.get(instanceId);
      if (!agentState) {
        throw new Error(`No sub-agent found with ID ${instanceId}`);
      }

      // Check if the agent was already terminated
      if (agentState.aborted) {
        return {
          output: agentState.output || 'Sub-agent was previously terminated',
          completed: true,
          terminated: true,
          messageSent: false,
          messageCount: 0,
        };
      }

      // Terminate the agent if requested
      if (terminate) {
        agentState.aborted = true;
        agentState.completed = true;

        return {
          output: agentState.output || 'Sub-agent terminated before completion',
          completed: true,
          terminated: true,
          messageSent: false,
          messageCount: 0,
        };
      }

      // Add guidance to the agent state's parentMessages array
      // The sub-agent will check for these messages on each iteration
      if (guidance) {
        logger.info(
          `Guidance provided to sub-agent ${instanceId}: ${guidance}`,
        );

        // Add the guidance to the parentMessages array
        agentState.parentMessages.push(guidance);

        logger.verbose(
          `Added message to sub-agent ${instanceId}'s parentMessages queue. Total messages: ${agentState.parentMessages.length}`,
        );
      }

      // Get the current output, reset it to an empty string
      const output =
        agentState.result?.result || agentState.output || 'No output yet';
      agentState.output = '';

      return {
        output,
        completed: agentState.completed,
        ...(agentState.error && { error: agentState.error }),
        messageSent: guidance ? true : false,
        messageCount: agentState.parentMessages.length,
      };
    } catch (error) {
      if (error instanceof Error) {
        logger.verbose(`Sub-agent interaction failed: ${error.message}`);

        return {
          output: '',
          completed: false,
          error: error.message,
          messageSent: false,
          messageCount: 0,
        };
      }

      const errorMessage = String(error);
      logger.error(
        `Unknown error during sub-agent interaction: ${errorMessage}`,
      );
      return {
        output: '',
        completed: false,
        error: `Unknown error occurred: ${errorMessage}`,
        messageSent: false,
        messageCount: 0,
      };
    }
  },

  logParameters: (input, { logger }) => {
    logger.info(
      `Interacting with sub-agent ${input.instanceId}, ${input.description}${input.terminate ? ' (terminating)' : ''}`,
    );
  },
  logReturns: (output, { logger }) => {
    if (output.error) {
      logger.error(`Sub-agent interaction error: ${output.error}`);
    } else if (output.terminated) {
      logger.info('Sub-agent was terminated');
    } else if (output.completed) {
      logger.info('Sub-agent has completed its task');
    } else {
      logger.info('Sub-agent is still running');
    }

    if (output.messageSent) {
      logger.info(
        `Message sent to sub-agent. Queue now has ${output.messageCount || 0} message(s).`,
      );
    }
  },
};
