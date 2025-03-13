import { cosmiconfig } from 'cosmiconfig';
import { ArgumentsCamelCase } from 'yargs';

import { SharedOptions } from '../options';

export type Config = {
  logLevel: string;
  githubMode: boolean;
  headless: boolean;
  userSession: boolean;
  pageFilter: 'simple' | 'none' | 'readability';
  provider: string;
  model: string;
  maxTokens: number;
  temperature: number;
  customPrompt: string | string[];
  profile: boolean;
  tokenCache: boolean;
  userPrompt: boolean;
  upgradeCheck: boolean;
  tokenUsage: boolean;

  ollamaBaseUrl: string;

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
};

// Default configuration
const defaultConfig: Config = {
  logLevel: 'info',

  // GitHub integration
  githubMode: true,

  // Browser settings
  headless: true,
  userSession: false,
  pageFilter: 'none' as 'simple' | 'none' | 'readability',

  // Model settings
  provider: 'anthropic',
  model: 'claude-3-7-sonnet-20250219',
  maxTokens: 4096,
  temperature: 0.7,

  // Custom settings
  customPrompt: '',
  profile: false,
  tokenCache: true,
  userPrompt: true,
  upgradeCheck: true,
  tokenUsage: false,

  // Ollama configuration
  ollamaBaseUrl: 'http://localhost:11434',

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
  };
};

function removeUndefined(obj: any) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined),
  );
}
/**
 * Load configuration using cosmiconfig
 * @returns Merged configuration with default values
 */
export async function loadConfig(
  cliOptions: Partial<Config> = {},
): Promise<Config> {
  // Initialize cosmiconfig
  const explorer = cosmiconfig('mycoder', {
    searchStrategy: 'global',
  });

  // Search for configuration file
  const result = await explorer.search();

  // Merge configurations with precedence: default < file < cli
  const fileConfig = result?.config || {};

  // Return merged configuration
  const mergedConfig = {
    ...defaultConfig,
    ...removeUndefined(fileConfig),
    ...removeUndefined(cliOptions),
  };
  return mergedConfig;
}
