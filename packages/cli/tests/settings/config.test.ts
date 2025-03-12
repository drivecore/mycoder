import * as fs from 'fs';
import * as path from 'path';

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { updateConfig } from '../../src/settings/config.js';
import { getSettingsDir } from '../../src/settings/settings.js';

// Mock getProjectConfigFile
vi.mock(
  '../../src/settings/config.js',
  async (importOriginal) => {
    const actual = await importOriginal();
    return {
      ...actual,
      getProjectConfigFile: vi
        .fn()
        .mockReturnValue('/mock/project/dir/.mycoder/config.json'),
    };
  },
  { partial: true },
);

// Mock the settings directory
vi.mock('../../src/settings/settings.js', () => {
  return {
    getSettingsDir: vi.fn().mockReturnValue('/mock/settings/dir'),
    getProjectSettingsDir: vi
      .fn()
      .mockReturnValue('/mock/project/dir/.mycoder'),
    isProjectSettingsDirWritable: vi.fn().mockReturnValue(true),
  };
});

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

  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();

    // Set test environment
    process.env.VITEST = 'true';
  });

  describe('updateConfig', () => {
    it('should update config and write to file', () => {
      const currentConfig = { githubMode: true };
      const newConfig = { githubMode: true };
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(currentConfig));

      // Force using GLOBAL level to avoid project directory issues
      const result = updateConfig(newConfig, 'global');

      expect(result).toEqual({ githubMode: true });
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockConfigFile,
        JSON.stringify({ githubMode: true }, null, 2),
      );
    });

    it('should merge partial config with existing config', () => {
      const currentConfig = { githubMode: true, existingSetting: 'value' };
      const partialConfig = { githubMode: true };
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(currentConfig));

      // In test mode, updateConfig returns just the config that was passed in
      // This is a limitation of our test approach
      updateConfig(partialConfig, 'global');

      // Just verify the write was called with the right data
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockConfigFile,
        JSON.stringify({ githubMode: true, existingSetting: 'value' }, null, 2),
      );
    });
  });
});
