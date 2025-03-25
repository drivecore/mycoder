export type SharedOptions = {
  readonly logLevel: string;
  readonly interactive: boolean;
  readonly file?: string;
  readonly tokenUsage?: boolean;
  readonly headless?: boolean;
  readonly userSession?: boolean;
  readonly provider?: string;
  readonly model?: string;
  readonly maxTokens?: number;
  readonly temperature?: number;
  readonly contextWindow?: number;
  readonly profile?: boolean;
  readonly userPrompt?: boolean;
  readonly upgradeCheck?: boolean;
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
  contextWindow: {
    type: 'number',
    description: 'Manual override for context window size in tokens',
  } as const,
  interactive: {
    type: 'boolean',
    alias: 'i',
    description:
      'Run in interactive mode, asking for prompts and enabling corrections during execution (use Ctrl+M to send corrections). Can be combined with -f/--file to append interactive input to file content.',
    default: false,
  } as const,
  file: {
    type: 'string',
    alias: 'f',
    description:
      'Read prompt from a file (can be combined with -i/--interactive)',
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
  userPrompt: {
    type: 'boolean',
    description: 'Alias for userPrompt: enable or disable the userPrompt tool',
  } as const,
  upgradeCheck: {
    type: 'boolean',
    description: 'Disable version upgrade check (for automated/remote usage)',
  } as const,

  subAgentMode: {
    type: 'string',
    description: 'Sub-agent workflow mode (disabled, sync, or async)',
    choices: ['disabled', 'sync', 'async'],
  } as const,
};
