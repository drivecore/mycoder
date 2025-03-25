/**
 * Tool for compacting message history to reduce token usage
 */
import { z } from 'zod';

import { generateText } from '../../core/llm/core.js';
import { createProvider } from '../../core/llm/provider.js';
import { Message } from '../../core/llm/types.js';
import { Tool, ToolContext } from '../../core/types.js';

/**
 * Schema for the compactHistory tool parameters
 */
export const CompactHistorySchema = z.object({
  preserveRecentMessages: z
    .number()
    .min(1)
    .max(50)
    .default(10)
    .describe('Number of recent messages to preserve unchanged'),
  customPrompt: z
    .string()
    .optional()
    .describe('Optional custom prompt for the summarization'),
});

/**
 * Default compaction prompt
 */
const DEFAULT_COMPACTION_PROMPT =
  "Provide a detailed but concise summary of our conversation above. Focus on information that would be helpful for continuing the conversation, including what we did, what we're doing, which files we're working on, and what we're going to do next.";

/**
 * Implementation of the compactHistory tool
 */
export const compactHistory = async (
  params: z.infer<typeof CompactHistorySchema>,
  context: ToolContext,
): Promise<string> => {
  const { preserveRecentMessages, customPrompt } = params;
  const { tokenTracker, logger } = context;

  // Access messages from the toolAgentCore.ts context
  // Since messages are passed directly to the executeTools function
  const messages = (context as any).messages;

  // Need at least preserveRecentMessages + 1 to do any compaction
  if (!messages || messages.length <= preserveRecentMessages) {
    return 'Not enough messages to compact. No changes made.';
  }

  logger.info(
    `Compacting message history, preserving ${preserveRecentMessages} recent messages`,
  );

  // Split messages into those to compact and those to preserve
  const messagesToCompact = messages.slice(
    0,
    messages.length - preserveRecentMessages,
  );
  const messagesToPreserve = messages.slice(
    messages.length - preserveRecentMessages,
  );

  // Create a system message with instructions for summarization
  const systemMessage: Message = {
    role: 'system',
    content:
      'You are an AI assistant tasked with summarizing a conversation. Provide a concise but informative summary that captures the key points, decisions, and context needed to continue the conversation effectively.',
  };

  // Create a user message with the compaction prompt
  const userMessage: Message = {
    role: 'user',
    content: `${customPrompt || DEFAULT_COMPACTION_PROMPT}\n\nHere's the conversation to summarize:\n${messagesToCompact.map((m) => `${m.role}: ${m.content}`).join('\n')}`,
  };

  // Generate the summary
  // Create a provider from the model provider configuration
  const llmProvider = createProvider(context.provider, context.model, {
    baseUrl: context.baseUrl,
    apiKey: context.apiKey,
  });

  const { text, tokenUsage } = await generateText(llmProvider, {
    messages: [systemMessage, userMessage],
    temperature: 0.3, // Lower temperature for more consistent summaries
  });

  // Add token usage to tracker
  tokenTracker.tokenUsage.add(tokenUsage);

  // Create a new message with the summary
  const summaryMessage: Message = {
    role: 'system',
    content: `[COMPACTED MESSAGE HISTORY]: ${text}`,
  };

  // Replace the original messages array with compacted version
  // This modifies the array in-place
  messages.splice(0, messages.length, summaryMessage, ...messagesToPreserve);

  // Calculate token reduction (approximate)
  const originalLength = messagesToCompact.reduce(
    (sum, m) => sum + m.content.length,
    0,
  );
  const newLength = summaryMessage.content.length;
  const reductionPercentage = Math.round(
    ((originalLength - newLength) / originalLength) * 100,
  );

  return `Successfully compacted ${messagesToCompact.length} messages into a summary, preserving the ${preserveRecentMessages} most recent messages. Reduced message history size by approximately ${reductionPercentage}%.`;
};

/**
 * CompactHistory tool definition
 */
export const CompactHistoryTool: Tool = {
  name: 'compactHistory',
  description:
    'Compacts the message history by summarizing older messages to reduce token usage',
  parameters: CompactHistorySchema,
  returns: z.string(),
  execute: compactHistory as unknown as (
    params: Record<string, any>,
    context: ToolContext,
  ) => Promise<string>,
};
