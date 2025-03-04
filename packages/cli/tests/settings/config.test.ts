import * as fs from 'fs';
import * as path from 'path';

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { getConfig, updateConfig } from '../../src/settings/config.js';
import { getSettingsDir } from '../../src/settings/settings.js';

// Mock the settings directory
vi.mock('../../src/settings/settings.js', () => ({
  getSettingsDir: vi.fn().mockReturnValue('/mock/settings/dir'),
}));

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

describe('Config', () => {
  const mockSettingsDir = '/mock/settings/dir';
  const mockConfigFile = path.join(mockSettingsDir, 'config.json');

  beforeEach(() => {
    vi.mocked(getSettingsDir).mockReturnValue(mockSettingsDir);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getConfig', () => {
    it('should return default config if config file does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const config = getConfig();

      expect(config).toEqual({
        githubMode: false,
        headless: true,
        userSession: false,
        pageFilter: 'none',
        modelProvider: 'anthropic',
        modelName: 'claude-3-7-sonnet-20250219',
        ollamaBaseUrl: 'http://localhost:11434/api',
      });
      expect(fs.existsSync).toHaveBeenCalledWith(mockConfigFile);
    });

    it('should return config from file if it exists', () => {
      const mockConfig = { githubMode: true, customSetting: 'value' };
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));

      const config = getConfig();

      expect(config).toEqual(mockConfig);
      expect(fs.existsSync).toHaveBeenCalledWith(mockConfigFile);
      expect(fs.readFileSync).toHaveBeenCalledWith(mockConfigFile, 'utf-8');
    });

    it('should return default config if reading file fails', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('Read error');
      });

      const config = getConfig();

      expect(config).toEqual({
        githubMode: false,
        headless: true,
        userSession: false,
        pageFilter: 'none',
        modelProvider: 'anthropic',
        modelName: 'claude-3-7-sonnet-20250219',
        ollamaBaseUrl: 'http://localhost:11434/api',
      });
    });
  });

  describe('updateConfig', () => {
    it('should update config and write to file', () => {
      const currentConfig = { githubMode: false };
      const newConfig = { githubMode: true };
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(currentConfig));

      const result = updateConfig(newConfig);

      expect(result).toEqual({ githubMode: true });
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockConfigFile,
        JSON.stringify({ githubMode: true }, null, 2),
      );
    });

    it('should merge partial config with existing config', () => {
      const currentConfig = { githubMode: false, existingSetting: 'value' };
      const partialConfig = { githubMode: true };
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(currentConfig));

      const result = updateConfig(partialConfig);

      expect(result).toEqual({ githubMode: true, existingSetting: 'value' });
    });
  });
});
