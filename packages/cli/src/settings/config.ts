import * as fs from 'fs';
import * as path from 'path';

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
  customPrompt: string;
  profile: boolean;
  tokenCache: boolean;
  userPrompt: boolean;
  upgradeCheck: boolean;
  tokenUsage: boolean;

  ollamaBaseUrl: string;
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

/**
 * Create a default configuration file if it doesn't exist
 * @param filePath Path to create the configuration file
 * @returns true if file was created, false if it already exists
 */
export function createDefaultConfigFile(filePath?: string): boolean {
  // Default to current directory if no path provided
  const configPath = filePath || path.join(process.cwd(), 'mycoder.config.js');

  // Check if file already exists
  if (fs.existsSync(configPath)) {
    return false;
  }

  // Create default configuration file
  const configContent = `// mycoder.config.js
export default {
  // GitHub integration
  githubMode: true,
  
  // Browser settings
  headless: true,
  userSession: false,
  pageFilter: 'none', // 'simple', 'none', or 'readability'
  
  // Model settings
  provider: 'anthropic',
  model: 'claude-3-7-sonnet-20250219',
  maxTokens: 4096,
  temperature: 0.7,
  
  // Custom settings
  customPrompt: '',
  profile: false,
  tokenCache: true,
  
  // Ollama configuration
  ollamaBaseUrl: 'http://localhost:11434',
  
  // API keys (better to use environment variables for these)
  // ANTHROPIC_API_KEY: 'your-api-key',
};
`;

  fs.writeFileSync(configPath, configContent);
  return true;
}
