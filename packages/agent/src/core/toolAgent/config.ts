import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { LLMInterface } from 'llm-interface';

/**
 * Available model providers
 */
export type ModelProvider =
  | 'anthropic'
  | 'openai'
  | 'ollama'
  | 'xai'
  | 'mistral';

/**
 * Get the model instance based on provider and model name
 *
 * This now returns a provider identifier that will be used by llm-interface
 */
export function getModel(
  provider: ModelProvider,
  modelName: string,
  options?: { ollamaBaseUrl?: string },
) {
  // Set up API keys from environment variables
  if (process.env.ANTHROPIC_API_KEY) {
    LLMInterface.setApiKey('anthropic', process.env.ANTHROPIC_API_KEY);
  }

  // Return the provider and model information for llm-interface
  switch (provider) {
    case 'anthropic':
      return { provider: 'anthropic.messages', model: modelName };
    case 'openai':
      return { provider: 'openai.chat', model: modelName };
    case 'ollama':
      return {
        provider: 'ollama.chat',
        model: modelName,
        ollamaBaseUrl: options?.ollamaBaseUrl,
      };
    case 'xai':
      return { provider: 'xai.chat', model: modelName };
    case 'mistral':
      return { provider: 'mistral.chat', model: modelName };
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
  model: { provider: 'anthropic.messages', model: 'claude-3-sonnet-20240229' },
  maxTokens: 4096,
  temperature: 0.7,
  getSystemPrompt: getDefaultSystemPrompt,
};

/**
 * Gets the default system prompt with contextual information about the environment
 */
export function getDefaultSystemPrompt(toolContext: ToolContext): string {
  // Gather context using Node.js APIs for cross-platform compatibility
  const getCurrentDirectory = (): string => {
    try {
      return process.cwd();
    } catch (error) {
      return `[Error getting current directory: ${(error as Error).message}]`;
    }
  };

  const getFileList = (): string => {
    try {
      const currentDir = process.cwd();
      const files = fs.readdirSync(currentDir, { withFileTypes: true });

      // Sort directories first, then files
      files.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });

      // Format similar to 'ls -la' output
      const fileDetails = files.map((file) => {
        try {
          const stats = fs.statSync(path.join(currentDir, file.name));
          const permissions = getPermissionString(stats);
          const links = stats.nlink || 1;
          const owner =
            process.platform === 'win32' ? 'OWNER' : stats.uid.toString();
          const group =
            process.platform === 'win32' ? 'GROUP' : stats.gid.toString();
          const size = stats.size;
          const mtime = stats.mtime
            .toDateString()
            .split(' ')
            .slice(1)
            .join(' ');
          const type = file.isDirectory() ? 'd' : '-';

          return `${type}${permissions} ${links.toString().padStart(2)} ${owner.padEnd(10)} ${group.padEnd(10)} ${size.toString().padStart(8)} ${mtime} ${file.name}${file.isDirectory() ? '/' : ''}`;
        } catch (err) {
          return `[Error getting details for ${file.name}: ${(err as Error).message}]`;
        }
      });

      return `total ${files.length}\n${fileDetails.join('\n')}`;
    } catch (error) {
      return `[Error getting file listing: ${(error as Error).message}]`;
    }
  };

  const getPermissionString = (stats: fs.Stats): string => {
    const mode = stats.mode;
    const permissions = [
      mode & 0o400 ? 'r' : '-',
      mode & 0o200 ? 'w' : '-',
      mode & 0o100 ? 'x' : '-',
      mode & 0o040 ? 'r' : '-',
      mode & 0o020 ? 'w' : '-',
      mode & 0o010 ? 'x' : '-',
      mode & 0o004 ? 'r' : '-',
      mode & 0o002 ? 'w' : '-',
      mode & 0o001 ? 'x' : '-',
    ].join('');

    return permissions;
  };

  const getSystemInfo = (): string => {
    try {
      return `${os.type()} ${os.hostname()} ${os.release()} ${os.platform()} ${os.arch()}`;
    } catch (error) {
      return `[Error getting system information: ${(error as Error).message}]`;
    }
  };

  const context = {
    pwd: getCurrentDirectory(),
    files: getFileList(),
    system: getSystemInfo(),
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
        '',
        'When creating GitHub issues, PRs, or comments, use temporary markdown files for the content instead of inline text:',
        '- Create a temporary markdown file with the content you want to include',
        '- Use the file with GitHub CLI commands (e.g., `gh issue create --body-file temp.md`)',
        '- Clean up the temporary file when done',
        '- This approach preserves formatting, newlines, and special characters correctly',
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
    toolContext.customPrompt ? `\n\n${toolContext.customPrompt}` : '',
  ].join('\n');
}
