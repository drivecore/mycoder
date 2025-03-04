import { execSync } from 'child_process';

import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { createOllama, ollama } from 'ollama-ai-provider';

/**
 * Available model providers
 */
export type ModelProvider = 'anthropic' | 'openai' | 'ollama';

/**
 * Get the model instance based on provider and model name
 */
export function getModel(
  provider: ModelProvider,
  modelName: string,
  options?: { ollamaBaseUrl?: string },
) {
  switch (provider) {
    case 'anthropic':
      return anthropic(modelName);
    case 'openai':
      return openai(modelName);
    case 'ollama':
      if (options?.ollamaBaseUrl) {
        return createOllama({
          baseURL: options.ollamaBaseUrl,
        })(modelName);
      }
      return ollama(modelName);
    default:
      throw new Error(`Unknown model provider: ${provider}`);
  }
}

import { ToolContext } from '../types';

/**
 * Default configuration for the tool agent
 */
export const DEFAULT_CONFIG = {
  maxIterations: 200,
  model: anthropic('claude-3-7-sonnet-20250219'),
  maxTokens: 4096,
  temperature: 0.7,
  getSystemPrompt: getDefaultSystemPrompt,
};

/**
 * Gets the default system prompt with contextual information about the environment
 */
export function getDefaultSystemPrompt(toolContext: ToolContext): string {
  // Gather context with error handling
  const getCommandOutput = (command: string, label: string): string => {
    try {
      return execSync(command).toString().trim();
    } catch (error) {
      return `[Error getting ${label}: ${(error as Error).message}]`;
    }
  };

  const context = {
    pwd: getCommandOutput('pwd', 'current directory'),
    files: getCommandOutput('ls -la', 'file listing'),
    system: getCommandOutput('uname -a', 'system information'),
    datetime: new Date().toString(),
    githubMode: toolContext.githubMode,
  };

  const githubModeInstructions = context.githubMode
    ? [
        '',
        '## GitHub Mode',
        'GitHub mode is enabled. You should work with GitHub issues and PRs as part of your workflow:',
        '- Start from existing GitHub issues or create new ones for tasks',
        "- Create branches for issues you're working on",
        '- Make commits with descriptive messages',
        '- Create PRs when work is complete',
        '- Create additional GitHub issues for follow-up tasks or ideas',
        '',
        'You can use the GitHub CLI (`gh`) for all GitHub interactions.',
      ].join('\n')
    : '';

  return [
    'You are an AI agent that can use tools to accomplish tasks.',
    '',
    'Current Context:',
    `Directory: ${context.pwd}`,
    'Files:',
    context.files,
    `System: ${context.system}`,
    `DateTime: ${context.datetime}`,
    githubModeInstructions,
    '',
    'You prefer to call tools in parallel when possible because it leads to faster execution and less resource usage.',
    'When done, call the sequenceComplete tool with your results to indicate that the sequence has completed.',
    '',
    'For coding tasks:',
    '0. Try to break large tasks into smaller sub-tasks that can be completed and verified sequentially.',
    "   - trying to make lots of changes in one go can make it really hard to identify when something doesn't work",
    '   - use sub-agents for each sub-task, leaving the main agent in a supervisory role',
    '   - when possible ensure the project compiles/builds and the tests pass after each sub-task',
    '   - give the sub-agents the guidance and context necessary be successful',
    '1. First understand the context by:',
    '   - Reading README.md, CONTRIBUTING.md, and similar documentation',
    '   - Checking project configuration files (e.g., package.json)',
    '   - Understanding coding standards',
    '2. Ensure changes:',
    '   - Follow project conventions',
    '   - Build successfully',
    '   - Pass all tests',
    '3. Update documentation as needed',
    '4. Consider adding documentation if you encountered setup/understanding challenges',
    '',
    'Feel free to use AI friendly search engines via the browser tools to search for information or for ideas when you get stuck.',
    '',
    'When you run into issues or unexpected results, take a step back and read the project documentation and configuration files and look at other source files in the project for examples of what works.',
    '',
    'Use sub-agents for parallel tasks, providing them with specific context they need rather than having them rediscover it.',
  ].join('\n');
}
