import { describe, it, expect, vi } from 'vitest';

import { getConfig, getDefaultConfig, Config } from './config';
import * as configLoader from './config-loader';

// Mock the config-loader module
vi.mock('./config-loader', () => ({
  loadConfig: vi.fn(),
}));

describe('config', () => {
  it('getConfig should call loadConfig with CLI options', () => {
    const mockConfig: Config = {
      githubMode: true,
      headless: false,
      userSession: false,
      pageFilter: 'none',
      provider: 'anthropic',
      model: 'claude-3-7-sonnet-20250219',
      maxTokens: 4096,
      temperature: 0.7,
      customPrompt: '',
      profile: false,
      tokenCache: true,
      ANTHROPIC_API_KEY: '',
    };
    vi.mocked(configLoader.loadConfig).mockReturnValue(mockConfig);

    const cliOptions = { headless: false };
    const result = getConfig(cliOptions);

    expect(configLoader.loadConfig).toHaveBeenCalledWith(cliOptions);
    expect(result).toEqual(mockConfig);
  });

  it('getDefaultConfig should call loadConfig with no arguments', () => {
    const mockConfig: Config = {
      githubMode: true,
      headless: true,
      userSession: false,
      pageFilter: 'none',
      provider: 'anthropic',
      model: 'claude-3-7-sonnet-20250219',
      maxTokens: 4096,
      temperature: 0.7,
      customPrompt: '',
      profile: false,
      tokenCache: true,
      ANTHROPIC_API_KEY: '',
    };
    vi.mocked(configLoader.loadConfig).mockReturnValue(mockConfig);

    const result = getDefaultConfig();

    expect(configLoader.loadConfig).toHaveBeenCalledWith();
    expect(result).toEqual(mockConfig);
  });
});
