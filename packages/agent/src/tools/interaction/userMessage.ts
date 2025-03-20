import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { Tool } from '../../core/types.js';

// Track the messages sent to the main agent
export const userMessages: string[] = [];

const parameterSchema = z.object({
  message: z
    .string()
    .describe('The message or correction to send to the main agent'),
  description: z
    .string()
    .describe('The reason for this message (max 80 chars)'),
});

const returnSchema = z.object({
  received: z
    .boolean()
    .describe('Whether the message was received by the main agent'),
  messageCount: z.number().describe('The number of messages in the queue'),
});

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

export const userMessageTool: Tool<Parameters, ReturnType> = {
  name: 'userMessage',
  description: 'Sends a message or correction from the user to the main agent',
  logPrefix: '✉️',
  parameters: parameterSchema,
  parametersJsonSchema: zodToJsonSchema(parameterSchema),
  returns: returnSchema,
  returnsJsonSchema: zodToJsonSchema(returnSchema),
  execute: async ({ message }, { logger }) => {
    logger.debug(`Received message from user: ${message}`);

    // Add the message to the queue
    userMessages.push(message);

    logger.debug(
      `Added message to queue. Total messages: ${userMessages.length}`,
    );

    return {
      received: true,
      messageCount: userMessages.length,
    };
  },
  logParameters: (input, { logger }) => {
    logger.log(`User message received: ${input.description}`);
  },
  logReturns: (output, { logger }) => {
    if (output.received) {
      logger.log(
        `Message added to queue. Queue now has ${output.messageCount} message(s).`,
      );
    } else {
      logger.error('Failed to add message to queue.');
    }
  },
};
