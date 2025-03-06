export type SharedOptions = {
  readonly logLevel: string;
  readonly interactive: boolean;
  readonly file?: string;
  readonly tokenUsage?: boolean;
  readonly headless?: boolean;
  readonly userSession?: boolean;
  readonly pageFilter?: 'simple' | 'none' | 'readability';
  readonly sentryDsn?: string;
  readonly modelProvider?: string;
  readonly modelName?: string;
  readonly maxTokens?: number;
  readonly temperature?: number;
  readonly profile?: boolean;
};

export const sharedOptions = {
  logLevel: {
    type: 'string',
    alias: 'l',
    description: 'Set minimum logging level',
    default: 'info',
    choices: ['debug', 'verbose', 'info', 'warn', 'error'],
  } as const,
  profile: {
    type: 'boolean',
    description: 'Enable performance profiling of CLI startup',
    default: false,
  } as const,
  modelProvider: {
    type: 'string',
    description: 'AI model provider to use',
    choices: ['anthropic', 'openai', 'ollama', 'xai', 'mistral'],
  } as const,
  modelName: {
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
    description: 'Run in interactive mode, asking for prompts',
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
    default: false,
  } as const,
  headless: {
    type: 'boolean',
    description: 'Use browser in headless mode with no UI showing',
    default: true,
  } as const,
  userSession: {
    type: 'boolean',
    description:
      "Use user's existing browser session instead of sandboxed session",
    default: false,
  } as const,
  pageFilter: {
    type: 'string',
    description: 'Method to process webpage content',
    default: 'none',
    choices: ['simple', 'none', 'readability'],
  } as const,
  sentryDsn: {
    type: 'string',
    description: 'Custom Sentry DSN for error tracking',
    hidden: true,
  } as const,
};
