import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { Tool } from '../../core/types.js';

import { SessionStatus } from './SessionTracker.js';

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
      sessionId: z.string(),
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

export const listSessionsTool: Tool<Parameters, ReturnType> = {
  name: 'listSessions',
  description: 'Lists all browser sessions and their status',
  logPrefix: '🔍',
  parameters: parameterSchema,
  returns: returnSchema,
  parametersJsonSchema: zodToJsonSchema(parameterSchema),
  returnsJsonSchema: zodToJsonSchema(returnSchema),

  execute: async (
    { status = 'all', verbose = false },
    { logger, browserTracker, ..._ },
  ): Promise<ReturnType> => {
    logger.debug(
      `Listing browser sessions with status: ${status}, verbose: ${verbose}`,
    );

    // Get all browser sessions
    const sessions = browserTracker.getSessions();

    // Filter by status if specified
    const filteredSessions =
      status === 'all'
        ? sessions
        : sessions.filter((session) => {
            const statusEnum =
              status.toUpperCase() as keyof typeof SessionStatus;
            return session.status === SessionStatus[statusEnum];
          });

    // Format the response
    const formattedSessions = filteredSessions.map((session) => {
      const now = new Date();
      const startTime = session.startTime;
      const endTime = session.endTime || now;
      const runtime = (endTime.getTime() - startTime.getTime()) / 1000; // in seconds

      return {
        sessionId: session.sessionId,
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
    logger.log(
      `Listing browser sessions with status: ${status}, verbose: ${verbose}`,
    );
  },

  logReturns: (output, { logger }) => {
    logger.log(`Found ${output.count} browser sessions`);
  },
};
