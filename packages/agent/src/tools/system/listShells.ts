import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { Tool } from '../../core/types.js';

import { ShellStatus, shellTracker } from './ShellTracker.js';

const parameterSchema = z.object({
  status: z
    .enum(['all', 'running', 'completed', 'error', 'terminated'])
    .optional()
    .describe('Filter shells by status (default: "all")'),
  verbose: z
    .boolean()
    .optional()
    .describe('Include detailed metadata about each shell (default: false)'),
});

const returnSchema = z.object({
  shells: z.array(
    z.object({
      id: z.string(),
      status: z.string(),
      startTime: z.string(),
      endTime: z.string().optional(),
      runtime: z.number().describe('Runtime in seconds'),
      command: z.string(),
      metadata: z.record(z.any()).optional(),
    }),
  ),
  count: z.number(),
});

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

export const listShellsTool: Tool<Parameters, ReturnType> = {
  name: 'listShells',
  description: 'Lists all shell processes and their status',
  logPrefix: '🔍',
  parameters: parameterSchema,
  returns: returnSchema,
  parametersJsonSchema: zodToJsonSchema(parameterSchema),
  returnsJsonSchema: zodToJsonSchema(returnSchema),

  execute: async (
    { status = 'all', verbose = false },
    { logger },
  ): Promise<ReturnType> => {
    logger.verbose(
      `Listing shell processes with status: ${status}, verbose: ${verbose}`,
    );

    // Get all shells
    let shells = shellTracker.getShells();

    // Filter by status if specified
    if (status !== 'all') {
      const statusEnum = status.toUpperCase() as keyof typeof ShellStatus;
      shells = shells.filter(
        (shell) => shell.status === ShellStatus[statusEnum],
      );
    }

    // Format the response
    const formattedShells = shells.map((shell) => {
      const now = new Date();
      const startTime = shell.startTime;
      const endTime = shell.endTime || now;
      const runtime = (endTime.getTime() - startTime.getTime()) / 1000; // in seconds

      return {
        id: shell.id,
        status: shell.status,
        startTime: startTime.toISOString(),
        ...(shell.endTime && { endTime: shell.endTime.toISOString() }),
        runtime: parseFloat(runtime.toFixed(2)),
        command: shell.metadata.command,
        ...(verbose && { metadata: shell.metadata }),
      };
    });

    return {
      shells: formattedShells,
      count: formattedShells.length,
    };
  },

  logParameters: ({ status = 'all', verbose = false }, { logger }) => {
    logger.info(
      `Listing shell processes with status: ${status}, verbose: ${verbose}`,
    );
  },

  logReturns: (output, { logger }) => {
    logger.info(`Found ${output.count} shell processes`);
  },
};
