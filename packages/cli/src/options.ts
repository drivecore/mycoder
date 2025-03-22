export type SharedOptions = {
  readonly logLevel: string;
  readonly interactive: boolean;
  readonly file?: string;
  readonly tokenUsage?: boolean;
  readonly headless?: boolean;
  readonly userSession?: boolean;
  readonly pageFilter?: 'simple' | 'none' | 'readability';
  readonly sentryDsn?: string;
  readonly provider?: string;
  readonly model?: string;
  readonly maxTokens?: number;
  readonly temperature?: number;
  readonly profile?: boolean;
  readonly tokenCache?: boolean;
  readonly userPrompt?: boolean;
  readonly githubMode?: boolean;
  readonly upgradeCheck?: boolean;
  readonly ollamaBaseUrl?: string;
  readonly subAgentMode?: 'disabled' | 'sync' | 'async';
};

export const sharedOptions = {
  logLevel: {
    type: 'string',
    alias: 'l',
    description: 'Set minimum logging level',

    choices: ['debug', 'verbose', 'info', 'warn', 'error'],
  } as const,
  profile: {
    type: 'boolean',
    description: 'Enable performance profiling of CLI startup',
  } as const,
  provider: {
    type: 'string',
    description: 'AI model provider to use',
    choices: ['anthropic', 'ollama', 'openai' /*, 'xai', 'mistral'*/],
  } as const,
  model: {
    type: 'string',
    description: 'AI model name to use',
  } as const,
  maxTokens: {
    type: 'number',
    description: 'Maximum number of tokens to generate',
  } as const,
  temperature: {
    type: 'number',
    description: 'Temperature for text generation (0.0-1.0)',
  } as const,
  interactive: {
    type: 'boolean',
    alias: 'i',
    description:
      'Run in interactive mode, asking for prompts and enabling corrections during execution (use Ctrl+M to send corrections)',
    default: false,
  } as const,
  file: {
    type: 'string',
    alias: 'f',
    description: 'Read prompt from a file',
  } as const,
  tokenUsage: {
    type: 'boolean',
    description: 'Output token usage at info log level',
  } as const,
  headless: {
    type: 'boolean',
    description: 'Use browser in headless mode with no UI showing',
  } as const,
  userSession: {
    type: 'boolean',
    description:
      "Use user's existing browser session instead of sandboxed session",
  } as const,
  pageFilter: {
    type: 'string',
    description: 'Method to process webpage content',
    choices: ['simple', 'none', 'readability'],
  } as const,
  tokenCache: {
    type: 'boolean',
    description: 'Enable token caching for LLM API calls',
  } as const,
  userPrompt: {
    type: 'boolean',
    description: 'Alias for userPrompt: enable or disable the userPrompt tool',
  } as const,
  githubMode: {
    type: 'boolean',
    description:
      'Enable GitHub mode for working with issues and PRs (requires git and gh CLI tools)',
    default: true,
  } as const,
  upgradeCheck: {
    type: 'boolean',
    description: 'Disable version upgrade check (for automated/remote usage)',
  } as const,
  ollamaBaseUrl: {
    type: 'string',
    description: 'Base URL for Ollama API (default: http://localhost:11434)',
  } as const,
  subAgentMode: {
    type: 'string',
    description: 'Sub-agent workflow mode (disabled, sync, or async)',
    choices: ['disabled', 'sync', 'async'],
  } as const,
};
