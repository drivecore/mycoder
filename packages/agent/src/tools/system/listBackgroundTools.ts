import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { BackgroundToolStatus } from '../../core/backgroundTools.js';
import { Tool } from '../../core/types.js';

const parameterSchema = z.object({
  status: z
    .enum(['all', 'running', 'completed', 'error', 'terminated'])
    .optional()
    .describe('Filter tools by status (default: "all")'),
  type: z
    .enum(['all', 'shell', 'agent'])
    .optional()
    .describe('Filter tools by type (default: "all")'),
  verbose: z
    .boolean()
    .optional()
    .describe('Include detailed metadata about each tool (default: false)'),
});

const returnSchema = z.object({
  tools: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      status: z.string(),
      startTime: z.string(),
      endTime: z.string().optional(),
      runtime: z.number().describe('Runtime in seconds'),
      metadata: z.record(z.any()).optional(),
    }),
  ),
  count: z.number(),
});

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

export const listBackgroundToolsTool: Tool<Parameters, ReturnType> = {
  name: 'listBackgroundTools',
  description: 'Lists all background tools (shells, agents) and their status',
  logPrefix: '🔍',
  parameters: parameterSchema,
  returns: returnSchema,
  parametersJsonSchema: zodToJsonSchema(parameterSchema),
  returnsJsonSchema: zodToJsonSchema(returnSchema),

  execute: async (
    { status = 'all', type = 'all', verbose = false },
    { logger, backgroundTools },
  ): Promise<ReturnType> => {
    logger.verbose(
      `Listing background tools with status: ${status}, type: ${type}, verbose: ${verbose}`,
    );

    // Get all tools for this agent
    const tools = backgroundTools.getTools();

    // Filter by status if specified
    const filteredByStatus =
      status === 'all'
        ? tools
        : tools.filter((tool) => {
            const statusEnum =
              status.toUpperCase() as keyof typeof BackgroundToolStatus;
            return tool.status === BackgroundToolStatus[statusEnum];
          });

    // Filter by type if specified
    const filteredTools =
      type === 'all'
        ? filteredByStatus
        : filteredByStatus.filter(
            (tool) => tool.type.toLowerCase() === type.toLowerCase(),
          );

    // Format the response
    const formattedTools = filteredTools.map((tool) => {
      const now = new Date();
      const startTime = tool.startTime;
      const endTime = tool.endTime || now;
      const runtime = (endTime.getTime() - startTime.getTime()) / 1000; // in seconds

      return {
        id: tool.id,
        type: tool.type,
        status: tool.status,
        startTime: startTime.toISOString(),
        ...(tool.endTime && { endTime: tool.endTime.toISOString() }),
        runtime: parseFloat(runtime.toFixed(2)),
        ...(verbose && { metadata: tool.metadata }),
      };
    });

    return {
      tools: formattedTools,
      count: formattedTools.length,
    };
  },

  logParameters: (
    { status = 'all', type = 'all', verbose = false },
    { logger },
  ) => {
    logger.info(
      `Listing ${type} background tools with status: ${status}, verbose: ${verbose}`,
    );
  },

  logReturns: (output, { logger }) => {
    logger.info(`Found ${output.count} background tools`);
  },
};
