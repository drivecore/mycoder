import type { ArgumentsType } from 'citty';

export const sharedArgs: ArgumentsType = {
  logLevel: {
    type: 'string',
    description: 'Set minimum logging level',
    options: ['debug', 'verbose', 'info', 'warn', 'error'],
  },
  profile: {
    type: 'boolean',
    description: 'Enable performance profiling of CLI startup',
  },
  provider: {
    type: 'string',
    description: 'AI model provider to use',
    options: ['anthropic', 'ollama', 'openai'],
  },
  model: {
    type: 'string',
    description: 'AI model name to use',
  },
  maxTokens: {
    type: 'number',
    description: 'Maximum number of tokens to generate',
  },
  temperature: {
    type: 'number',
    description: 'Temperature for text generation (0.0-1.0)',
  },
  interactive: {
    type: 'boolean',
    alias: 'i',
    description: 'Run in interactive mode, asking for prompts',
    default: false,
  },
  file: {
    type: 'string',
    alias: 'f',
    description: 'Read prompt from a file',
  },
  tokenUsage: {
    type: 'boolean',
    description: 'Output token usage at info log level',
  },
  headless: {
    type: 'boolean',
    description: 'Use browser in headless mode with no UI showing',
  },
  userSession: {
    type: 'boolean',
    description:
      "Use user's existing browser session instead of sandboxed session",
  },
  pageFilter: {
    type: 'string',
    description: 'Method to process webpage content',
    options: ['simple', 'none', 'readability'],
  },
  tokenCache: {
    type: 'boolean',
    description: 'Enable token caching for LLM API calls',
  },
  userPrompt: {
    type: 'boolean',
    description: 'Alias for userPrompt: enable or disable the userPrompt tool',
  },
  githubMode: {
    type: 'boolean',
    description:
      'Enable GitHub mode for working with issues and PRs (requires git and gh CLI tools)',
    default: true,
  },
  upgradeCheck: {
    type: 'boolean',
    description: 'Disable version upgrade check (for automated/remote usage)',
  },
  ollamaBaseUrl: {
    type: 'string',
    description: 'Base URL for Ollama API (default: http://localhost:11434)',
  },
};

// Type definition for CLI args
export interface SharedArgs {
  logLevel?: string;
  interactive?: boolean;
  file?: string;
  tokenUsage?: boolean;
  headless?: boolean;
  userSession?: boolean;
  pageFilter?: 'simple' | 'none' | 'readability';
  sentryDsn?: string;
  provider?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  profile?: boolean;
  tokenCache?: boolean;
  userPrompt?: boolean;
  githubMode?: boolean;
  upgradeCheck?: boolean;
  ollamaBaseUrl?: string;
}

// Type for default command with prompt
export interface DefaultArgs extends SharedArgs {
  prompt?: string;
}
