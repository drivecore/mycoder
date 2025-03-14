import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { Tool } from '../../core/types.js';

import { BrowserSessionStatus, getBrowserTracker } from './browserTracker.js';

const parameterSchema = z.object({
  status: z
    .enum(['all', 'running', 'completed', 'error', 'terminated'])
    .optional()
    .describe('Filter browser sessions by status (default: "all")'),
  verbose: z
    .boolean()
    .optional()
    .describe(
      'Include detailed metadata about each browser session (default: false)',
    ),
});

const returnSchema = z.object({
  sessions: z.array(
    z.object({
      id: z.string(),
      status: z.string(),
      startTime: z.string(),
      endTime: z.string().optional(),
      runtime: z.number().describe('Runtime in seconds'),
      url: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    }),
  ),
  count: z.number(),
});

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

export const listBrowsersTool: Tool<Parameters, ReturnType> = {
  name: 'listBrowsers',
  description: 'Lists all browser sessions and their status',
  logPrefix: '🔍',
  parameters: parameterSchema,
  returns: returnSchema,
  parametersJsonSchema: zodToJsonSchema(parameterSchema),
  returnsJsonSchema: zodToJsonSchema(returnSchema),

  execute: async (
    { status = 'all', verbose = false },
    { logger, agentName = 'default' },
  ): Promise<ReturnType> => {
    logger.verbose(
      `Listing browser sessions with status: ${status}, verbose: ${verbose}`,
    );

    // Get the browser tracker instance
    const browserTracker = getBrowserTracker(agentName);

    // Get all browser sessions
    const sessions = browserTracker.getSessions();

    // Filter by status if specified
    const filteredSessions =
      status === 'all'
        ? sessions
        : sessions.filter((session) => {
            const statusEnum =
              status.toUpperCase() as keyof typeof BrowserSessionStatus;
            return session.status === BrowserSessionStatus[statusEnum];
          });

    // Format the response
    const formattedSessions = filteredSessions.map((session) => {
      const now = new Date();
      const startTime = session.startTime;
      const endTime = session.endTime || now;
      const runtime = (endTime.getTime() - startTime.getTime()) / 1000; // in seconds

      return {
        id: session.id,
        status: session.status,
        startTime: startTime.toISOString(),
        ...(session.endTime && { endTime: session.endTime.toISOString() }),
        runtime: parseFloat(runtime.toFixed(2)),
        url: session.metadata.url,
        ...(verbose && { metadata: session.metadata }),
      };
    });

    return {
      sessions: formattedSessions,
      count: formattedSessions.length,
    };
  },

  logParameters: ({ status = 'all', verbose = false }, { logger }) => {
    logger.info(
      `Listing browser sessions with status: ${status}, verbose: ${verbose}`,
    );
  },

  logReturns: (output, { logger }) => {
    logger.info(`Found ${output.count} browser sessions`);
  },
};
