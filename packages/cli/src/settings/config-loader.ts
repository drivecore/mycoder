import * as fs from 'fs';
import * as path from 'path';

import { cosmiconfigSync } from 'cosmiconfig';

import { Config } from './config.js';

// Default configuration
const defaultConfig: Config = {
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

  // Ollama configuration
  ollamaBaseUrl: 'http://localhost:11434',

  // API keys (empty by default)
  ANTHROPIC_API_KEY: '',
  OPENAI_API_KEY: '',
};

/**
 * Load configuration using cosmiconfig
 * @returns Merged configuration with default values
 */
export function loadConfig(cliOptions: Partial<Config> = {}): Config {
  // Initialize cosmiconfig
  const explorer = cosmiconfigSync('mycoder', {
    searchPlaces: ['mycoder.config.js', 'package.json'],
  });

  // Search for configuration file
  const result = explorer.search();

  // Merge configurations with precedence: default < file < cli
  const fileConfig = result?.config || {};

  // Return merged configuration
  return {
    ...defaultConfig,
    ...fileConfig,
    ...cliOptions,
  };
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
