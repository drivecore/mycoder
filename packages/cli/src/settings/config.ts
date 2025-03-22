import { loadConfig as loadC12Config, watchConfig } from 'c12';
import { ArgumentsCamelCase } from 'yargs';

import { SharedOptions } from '../options';

export type Config = {
  logLevel: string;
  githubMode: boolean;
  headless: boolean;
  userSession: boolean;
  pageFilter: 'simple' | 'none' | 'readability';
  provider: string;
  model?: string;
  maxTokens: number;
  temperature: number;
  customPrompt: string | string[];
  profile: boolean;
  tokenCache: boolean;
  userPrompt: boolean;
  upgradeCheck: boolean;
  tokenUsage: boolean;
  interactive: boolean;
  subAgentMode?: 'disabled' | 'sync' | 'async';

  baseUrl?: string;

  // MCP configuration
  mcp?: {
    servers?: Array<{
      name: string;
      url: string;
      auth?: {
        type: 'bearer';
        token: string;
      };
    }>;
    defaultResources?: string[];
  };

  // Custom commands configuration
  commands?: Record<
    string,
    {
      description?: string;
      args?: Array<{
        name: string;
        description?: string;
        required?: boolean;
        default?: string;
      }>;
      execute: (args: Record<string, string>) => string | Promise<string>;
    }
  >;
};

// Default configuration
const defaultConfig: Config = {
  logLevel: 'log',

  // GitHub integration
  githubMode: true,

  // Browser settings
  headless: true,
  userSession: false,
  pageFilter: 'none' as 'simple' | 'none' | 'readability',

  // Model settings
  provider: 'anthropic',
  maxTokens: 4096,
  temperature: 0.7,

  // Custom settings
  customPrompt: '',
  profile: false,
  tokenCache: true,
  userPrompt: true,
  upgradeCheck: true,
  tokenUsage: false,
  interactive: false,
  subAgentMode: 'async',

  // MCP configuration
  mcp: {
    servers: [],
    defaultResources: [],
  },
};

export const getConfigFromArgv = (argv: ArgumentsCamelCase<SharedOptions>) => {
  return {
    logLevel: argv.logLevel,
    tokenCache: argv.tokenCache,
    provider: argv.provider,
    model: argv.model,
    maxTokens: argv.maxTokens,
    temperature: argv.temperature,
    profile: argv.profile,
    githubMode: argv.githubMode,
    userSession: argv.userSession,
    pageFilter: argv.pageFilter,
    headless: argv.headless,
    ollamaBaseUrl: argv.ollamaBaseUrl,
    userPrompt: argv.userPrompt,
    upgradeCheck: argv.upgradeCheck,
    tokenUsage: argv.tokenUsage,
    interactive: argv.interactive,
    subAgentMode: argv.subAgentMode,
  };
};

/**
 * Validates custom commands configuration
 * @param config The configuration object
 * @throws Error if any command configuration is invalid
 */
function validateCustomCommands(config: Config): void {
  if (!config.commands) return;

  Object.entries(config.commands).forEach(([name, command]) => {
    // Validate name (should be valid command name)
    if (!/^[a-z][\w-]*$/.test(name)) {
      throw new Error(
        `Invalid command name: ${name}. Command names should start with a letter and contain only letters, numbers, hyphens, and underscores.`,
      );
    }

    // Validate execute property
    if (typeof command.execute !== 'function') {
      throw new Error(
        `Invalid execute property for command ${name}. Should be a function.`,
      );
    }
  });
}
/**
 * Load configuration using c12
 * @returns Merged configuration with default values
 */
export async function loadConfig(
  cliOptions: Partial<Config> = {},
): Promise<Config> {
  const { config } = await loadC12Config({
    name: 'mycoder',
    defaults: defaultConfig,
    overrides: cliOptions,
    globalRc: true,
  });

  // Convert to Config type and validate custom commands
  const typedConfig = config as unknown as Config;
  validateCustomCommands(typedConfig);

  return typedConfig;
}

/**
 * Watch configuration for changes
 * @param cliOptions CLI options to override configuration
 * @param onUpdate Callback when configuration is updated
 */
export async function watchConfigForChanges(
  cliOptions: Partial<Config> = {},
  onUpdate?: (config: Config) => void,
) {
  const { config, watchingFiles, unwatch } = await watchConfig({
    name: 'mycoder',
    defaults: defaultConfig,
    overrides: cliOptions,
    onUpdate: ({ newConfig }) => {
      const typedConfig = newConfig as unknown as Config;
      validateCustomCommands(typedConfig);
      if (onUpdate) {
        onUpdate(typedConfig);
      }
    },
  });

  return {
    config: config as unknown as Config,
    watchingFiles,
    unwatch,
  };
}
