import * as fs from 'fs';
import * as path from 'path';

import { getSettingsDir } from './settings.js';

const configFile = path.join(getSettingsDir(), 'config.json');

// Default configuration
const defaultConfig = {
  // Add default configuration values here
  githubMode: false,
  headless: true,
  userSession: false,
  pageFilter: 'none' as 'simple' | 'none' | 'readability',
  modelProvider: 'anthropic',
  modelName: 'claude-3-7-sonnet-20250219',
  ollamaBaseUrl: 'http://localhost:11434/api',
};

export type Config = typeof defaultConfig;

export const getConfig = (): Config => {
  if (!fs.existsSync(configFile)) {
    return defaultConfig;
  }
  try {
    return JSON.parse(fs.readFileSync(configFile, 'utf-8'));
  } catch {
    return defaultConfig;
  }
};

export const updateConfig = (config: Partial<Config>): Config => {
  const currentConfig = getConfig();
  const updatedConfig = { ...currentConfig, ...config };
  fs.writeFileSync(configFile, JSON.stringify(updatedConfig, null, 2));
  return updatedConfig;
};
