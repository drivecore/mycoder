import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { Tool } from '../../core/types.js';
import { userPrompt } from '../../utils/userPrompt.js';

const parameterSchema = z.object({
  prompt: z.string().describe('The prompt message to display to the user'),
});

const returnSchema = z.object({
  userText: z.string().describe("The user's response"),
});

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

export const userPromptTool: Tool<Parameters, ReturnType> = {
  name: 'userPrompt',
  description: 'Prompts the user for input and returns their response',
  logPrefix: '🗣️',
  parameters: parameterSchema,
  parametersJsonSchema: zodToJsonSchema(parameterSchema),
  returns: returnSchema,
  returnsJsonSchema: zodToJsonSchema(returnSchema),
  execute: async ({ prompt }, { logger }) => {
    logger.debug(`Prompting user with: ${prompt}`);

    const response = await userPrompt(prompt);

    logger.debug(`Received user response: ${response}`);

    return { userText: response };
  },
  logParameters: () => {},
  logReturns: () => {},
};
