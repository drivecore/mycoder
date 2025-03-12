import { loadConfig } from './config-loader.js';

// Default configuration type definition
export type Config = {
  // GitHub integration
  githubMode: boolean;

  // Browser settings
  headless: boolean;
  userSession: boolean;
  pageFilter: 'simple' | 'none' | 'readability';

  // Model settings
  provider: string;
  model: string;
  maxTokens: number;
  temperature: number;

  // Custom settings
  customPrompt: string;
  profile: boolean;
  tokenCache: boolean;

  // API keys
  ANTHROPIC_API_KEY: string;
  OPENAI_API_KEY: string;

  // Additional properties can be added by users
  [key: string]: any;
};

/**
 * Get the configuration by loading from config files and merging with CLI options
 * @param cliOptions Optional CLI options to include in the merge
 * @returns The merged configuration
 */
export const getConfig = (cliOptions: Partial<Config> = {}): Config => {
  return loadConfig(cliOptions);
};

/**
 * Get the default configuration
 * @returns A copy of the default configuration
 */
export const getDefaultConfig = (): Config => {
  return loadConfig();
};
