import * as fs from 'fs';
import * as path from 'path';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock fs and path modules
vi.mock('fs');
vi.mock('path');
vi.mock('process', () => ({
  cwd: vi.fn().mockReturnValue('/test/project/dir'),
}));
vi.mock('os', () => ({
  homedir: vi.fn().mockReturnValue('/test/home/dir'),
}));

// Import modules after mocking
import {
  getConfig,
  getConfigAtLevel,
  updateConfig,
  clearConfigAtLevel,
  clearConfigKey,
  ConfigLevel,
} from './config.js';

describe('Hierarchical Configuration', () => {
  // Setup mock data
  const _mockDefaultConfig = {
    githubMode: false,
    headless: true,
    provider: 'anthropic',
    model: 'claude-3-7-sonnet-20250219',
  };

  const mockGlobalConfig = {
    provider: 'openai',
    model: 'gpt-4',
  };

  const mockProjectConfig = {
    model: 'claude-3-opus',
  };

  const mockCliOptions = {
    headless: false,
  };

  // Mock file paths
  const mockGlobalConfigPath = '/test/home/dir/.mycoder/config.json';
  const mockProjectConfigPath = '/test/project/dir/.mycoder/config.json';

  // Setup before each test
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();

    // Mock path.join to return expected paths
    vi.mocked(path.join).mockImplementation((...args) => {
      if (args.includes('.mycoder') && args.includes('/test/home/dir')) {
        return mockGlobalConfigPath;
      }
      if (args.includes('.mycoder') && args.includes('/test/project/dir')) {
        return mockProjectConfigPath;
      }
      return args.join('/');
    });

    // Mock fs.existsSync to return true for config files
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      if (path === mockGlobalConfigPath || path === mockProjectConfigPath) {
        return true;
      }
      return false;
    });

    // Mock fs.readFileSync to return mock configs
    vi.mocked(fs.readFileSync).mockImplementation((path, _) => {
      if (path === mockGlobalConfigPath) {
        return JSON.stringify(mockGlobalConfig);
      }
      if (path === mockProjectConfigPath) {
        return JSON.stringify(mockProjectConfig);
      }
      return '';
    });
  });

  // Clean up after each test
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should get configuration from a specific level', () => {
    const defaultConfig = getConfigAtLevel(ConfigLevel.DEFAULT);
    expect(defaultConfig).toMatchObject(
      expect.objectContaining({
        githubMode: false,
        headless: true,
      }),
    );

    const globalConfig = getConfigAtLevel(ConfigLevel.GLOBAL);
    expect(globalConfig).toEqual(mockGlobalConfig);

    const projectConfig = getConfigAtLevel(ConfigLevel.PROJECT);
    expect(projectConfig).toEqual(mockProjectConfig);
  });

  it('should merge configurations with correct precedence', () => {
    const mergedConfig = getConfig(mockCliOptions);

    // CLI options should override project config
    expect(mergedConfig.headless).toBe(false);

    // Project config should override global config
    expect(mergedConfig.model).toBe('claude-3-opus');

    // Global config should override default config
    expect(mergedConfig.provider).toBe('openai');

    // Default config values should be present if not overridden
    expect(mergedConfig.githubMode).toBe(false);
  });

  it('should update configuration at the specified level', () => {
    const mockWrite = vi.fn();
    vi.mocked(fs.writeFileSync).mockImplementation(mockWrite);

    updateConfig({ model: 'new-model' }, ConfigLevel.GLOBAL);

    expect(mockWrite).toHaveBeenCalledWith(
      mockGlobalConfigPath,
      expect.stringContaining('new-model'),
      expect.anything(),
    );
  });

  it('should clear configuration at the specified level', () => {
    const mockUnlink = vi.fn();
    vi.mocked(fs.unlinkSync).mockImplementation(mockUnlink);

    clearConfigAtLevel(ConfigLevel.PROJECT);

    expect(mockUnlink).toHaveBeenCalledWith(mockProjectConfigPath);
  });

  it('should clear a specific key from configuration at the specified level', () => {
    const mockWrite = vi.fn();
    vi.mocked(fs.writeFileSync).mockImplementation(mockWrite);

    clearConfigKey('model', ConfigLevel.PROJECT);

    expect(mockWrite).toHaveBeenCalledWith(
      mockProjectConfigPath,
      expect.not.stringContaining('claude-3-opus'),
      expect.anything(),
    );
  });
});
