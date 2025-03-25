import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { Tool } from '../../core/types.js';

import { agentStates } from './agentStart.js';

const parameterSchema = z.object({
  agentId: z.string().describe('The ID returned by agentStart'),
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
    { agentId, guidance, terminate, description: _ },
    { logger, agentTracker, ...__ },
  ): Promise<ReturnType> => {
    logger.debug(
      `Interacting with sub-agent ${agentId}${guidance ? ' with guidance' : ''}${terminate ? ' with termination request' : ''}`,
    );

    try {
      // First try to get the agent from the tracker
      let agent = agentTracker.getAgent(agentId);

      // Fall back to legacy agentStates for backward compatibility
      if (!agent && agentStates.has(agentId)) {
        // If found in legacy store, register it with the tracker for future use
        const legacyState = agentStates.get(agentId)!;
        agentTracker.registerAgent(legacyState);

        // Try again with the newly registered agent
        agent = agentTracker.getAgent(agentId);
      }

      if (!agent) {
        throw new Error(`No sub-agent found with ID ${agentId}`);
      }

      // Check if the agent was already terminated
      if (agent.aborted) {
        return {
          output: agent.output || 'Sub-agent was previously terminated',
          completed: true,
          terminated: true,
          messageSent: false,
          messageCount: 0,
        };
      }

      // Terminate the agent if requested
      if (terminate) {
        agent.aborted = true;
        agent.completed = true;

        return {
          output: agent.output || 'Sub-agent terminated before completion',
          completed: true,
          terminated: true,
          messageSent: false,
          messageCount: 0,
        };
      }

      // Add guidance to the agent state's parentMessages array
      // The sub-agent will check for these messages on each iteration
      if (guidance) {
        logger.log(`Guidance provided to sub-agent ${agentId}: ${guidance}`);

        // Add the guidance to the parentMessages array
        agent.parentMessages.push(guidance);

        logger.debug(
          `Added message to sub-agent ${agentId}'s parentMessages queue. Total messages: ${agent.parentMessages.length}`,
        );
      }

      // Get the current output and captured logs
      const resultOutput = agent.result_detailed?.result || '';
      let output = resultOutput || agent.output || 'No output yet';

      // Append captured logs if there are any
      if (agent.capturedLogs && agent.capturedLogs.length > 0) {
        // Always append logs if there are any
        const logContent = agent.capturedLogs.join('\n');
        output = `${output}\n\n--- Agent Log Messages ---\n${logContent}`;

        // Log that we're returning captured logs
        logger.debug(
          `Returning ${agent.capturedLogs.length} captured log messages for agent ${agentId}`,
        );
        // Clear the captured logs after retrieving them
        agent.capturedLogs = [];
      }

      // Reset the output to an empty string
      agent.output = '';

      return {
        output,
        completed: agent.completed,
        ...(agent.error && { error: agent.error }),
        messageSent: guidance ? true : false,
        messageCount: agent.parentMessages.length,
      };
    } catch (error) {
      if (error instanceof Error) {
        logger.debug(`Sub-agent interaction failed: ${error.message}`);

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
    logger.log(
      `Interacting with sub-agent ${input.agentId}, ${input.description}${input.terminate ? ' (terminating)' : ''}`,
    );
  },
  logReturns: (output, { logger }) => {
    if (output.error) {
      logger.error(`Sub-agent interaction error: ${output.error}`);
    } else if (output.terminated) {
      logger.log('Sub-agent was terminated');
    } else if (output.completed) {
      logger.log('Sub-agent has completed its task');
    } else {
      logger.log('Sub-agent is still running');
    }

    if (output.messageSent) {
      logger.log(
        `Message sent to sub-agent. Queue now has ${output.messageCount || 0} message(s).`,
      );
    }
  },
};
