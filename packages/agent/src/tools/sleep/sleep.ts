import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { Tool } from '../../core/types.js';
import { sleep } from '../../utils/sleep.js';

const MAX_SLEEP_SECONDS = 3600; // 1 hour

const parametersSchema = z.object({
  seconds: z
    .number()
    .min(0)
    .max(MAX_SLEEP_SECONDS)
    .describe('Number of seconds to sleep (max 1 hour)'),
});

const returnsSchema = z.object({
  sleptFor: z.number().describe('Actual number of seconds slept'),
});

export const sleepTool: Tool = {
  name: 'sleep',
  description:
    'Pauses execution for the specified number of seconds, useful when waiting for async tools to make progress before checking on them',
  logPrefix: '💤',
  parameters: parametersSchema,
  returns: returnsSchema,
  parametersJsonSchema: zodToJsonSchema(parametersSchema),
  returnsJsonSchema: zodToJsonSchema(returnsSchema),
  async execute(params) {
    const { seconds } = parametersSchema.parse(params);

    await sleep(seconds * 1000);

    return returnsSchema.parse({
      sleptFor: seconds,
    });
  },
  logParameters({ seconds }) {
    return `sleeping for ${seconds} seconds`;
  },
  logReturns() {
    return '';
  },
};
