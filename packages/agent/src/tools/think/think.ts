import { z } from 'zod';

/**
 * Schema for the think tool parameters
 */
const parameters = z.object({
  thought: z.string().describe('A thought to think about.'),
});

/**
 * Schema for the think tool returns
 */
const returns = z.object({
  thought: z.string().describe('The thought that was processed.'),
});

/**
 * Think tool implementation
 *
 * This tool allows the agent to explicitly think through a complex problem
 * without taking any external actions. It serves as a way to document the
 * agent's reasoning process and can improve problem-solving abilities.
 *
 * Based on research from Anthropic showing how a simple "think" tool can
 * improve Claude's problem-solving skills.
 */
export const thinkTool = {
  name: 'think',
  description:
    'Use the tool to think about something. It will not obtain new information or change any state, but just helps with complex reasoning.',
  parameters,
  returns,
  execute: async ({ thought }, { logger }) => {
    // Log the thought process
    logger.log(`Thinking: ${thought}`);

    // Simply return the thought - no side effects
    return {
      thought,
    };
  },
};
