import * as fs from 'fs';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  loadConfig,
  createDefaultConfigFile,
} from '../../src/settings/config-loader';

// Mock cosmiconfig
vi.mock('cosmiconfig', () => {
  return {
    cosmiconfigSync: vi.fn(() => ({
      search: vi.fn(() => null),
    })),
  };
});

// Mock fs
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    writeFileSync: vi.fn(),
  };
});

describe('config-loader', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loadConfig', () => {
    it('should return default config when no config file exists', () => {
      const config = loadConfig();
      expect(config).toHaveProperty('githubMode');
      expect(config).toHaveProperty('headless');
      expect(config).toHaveProperty('model');
    });

    it('should merge CLI options with default config', () => {
      const cliOptions = { githubMode: false, headless: false };
      const config = loadConfig(cliOptions);
      expect(config.githubMode).toBe(false);
      expect(config.headless).toBe(false);
    });
  });

  describe('createDefaultConfigFile', () => {
    it('should create a default config file when it does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const result = createDefaultConfigFile('test-config.js');
      expect(result).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should not create a config file when it already exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const result = createDefaultConfigFile('test-config.js');
      expect(result).toBe(false);
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should use the current directory if no path is provided', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      createDefaultConfigFile();
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('mycoder.config.js'),
        expect.any(String),
      );
    });
  });
});
