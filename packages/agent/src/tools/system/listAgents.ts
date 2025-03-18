import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { Tool } from '../../core/types.js';
import { AgentStatus } from '../interaction/agentTracker.js';

const parameterSchema = z.object({
  status: z
    .enum(['all', 'running', 'completed', 'error', 'terminated'])
    .optional()
    .describe('Filter agents by status (default: "all")'),
  verbose: z
    .boolean()
    .optional()
    .describe('Include detailed information about each agent (default: false)'),
});

const returnSchema = z.object({
  agents: z.array(
    z.object({
      id: z.string(),
      status: z.string(),
      goal: z.string(),
      startTime: z.string(),
      endTime: z.string().optional(),
      runtime: z.number().describe('Runtime in seconds'),
      result: z.string().optional(),
      error: z.string().optional(),
    }),
  ),
  count: z.number(),
});

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

export const listAgentsTool: Tool<Parameters, ReturnType> = {
  name: 'listAgents',
  description: 'Lists all sub-agents and their status',
  logPrefix: '🤖',
  parameters: parameterSchema,
  returns: returnSchema,
  parametersJsonSchema: zodToJsonSchema(parameterSchema),
  returnsJsonSchema: zodToJsonSchema(returnSchema),

  execute: async (
    { status = 'all', verbose = false },
    { logger, agentTracker },
  ): Promise<ReturnType> => {
    logger.verbose(
      `Listing agents with status: ${status}, verbose: ${verbose}`,
    );

    // Get all agents
    let agents = agentTracker.getAgents();

    // Filter by status if specified
    if (status !== 'all') {
      const statusEnum = status.toUpperCase() as keyof typeof AgentStatus;
      agents = agents.filter(
        (agent) => agent.status === AgentStatus[statusEnum],
      );
    }

    // Format the response
    const formattedAgents = agents.map((agent) => {
      const now = new Date();
      const startTime = agent.startTime;
      const endTime = agent.endTime || now;
      const runtime = (endTime.getTime() - startTime.getTime()) / 1000; // in seconds

      const result: {
        id: string;
        status: string;
        goal: string;
        startTime: string;
        endTime?: string;
        runtime: number;
        result?: string;
        error?: string;
      } = {
        id: agent.id,
        status: agent.status,
        goal: agent.goal,
        startTime: startTime.toISOString(),
        ...(agent.endTime && { endTime: agent.endTime.toISOString() }),
        runtime: parseFloat(runtime.toFixed(2)),
      };

      // Add result/error if verbose or if they exist
      if (verbose || agent.result) {
        result.result = agent.result;
      }

      if (verbose && agent.error) {
        result.error = agent.error;
      }

      return result;
    });

    return {
      agents: formattedAgents,
      count: formattedAgents.length,
    };
  },

  logParameters: ({ status = 'all', verbose = false }, { logger }) => {
    logger.info(`Listing agents with status: ${status}, verbose: ${verbose}`);
  },

  logReturns: (output, { logger }) => {
    logger.info(`Found ${output.count} agents`);
  },
};
