import * as fs from 'fs';
import * as path from 'path';

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock modules
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

vi.mock('path', () => ({
  join: vi.fn(),
}));

// Mock settings module
vi.mock('./settings.js', () => ({
  getSettingsDir: vi.fn().mockReturnValue('/test/home/dir/.mycoder'),
  getProjectSettingsDir: vi.fn().mockReturnValue('/test/project/dir/.mycoder'),
  isProjectSettingsDirWritable: vi.fn().mockReturnValue(true),
}));

// Import after mocking
import { readConfigFile } from './config.js';

describe('Hierarchical Configuration', () => {
  // Mock file paths
  const mockGlobalConfigPath = '/test/home/dir/.mycoder/config.json';
  const mockProjectConfigPath = '/test/project/dir/.mycoder/config.json';

  // Mock config data
  const mockGlobalConfig = {
    provider: 'openai',
    model: 'gpt-4',
  };

  const mockProjectConfig = {
    model: 'claude-3-opus',
  };

  beforeEach(() => {
    vi.resetAllMocks();

    // Set environment
    process.env.VITEST = 'true';

    // Mock path.join
    vi.mocked(path.join).mockImplementation((...args) => {
      if (args.includes('/test/home/dir/.mycoder')) {
        return mockGlobalConfigPath;
      }
      if (args.includes('/test/project/dir/.mycoder')) {
        return mockProjectConfigPath;
      }
      return args.join('/');
    });

    // Mock fs.existsSync
    vi.mocked(fs.existsSync).mockReturnValue(true);

    // Mock fs.readFileSync
    vi.mocked(fs.readFileSync).mockImplementation((filePath) => {
      if (filePath === mockGlobalConfigPath) {
        return JSON.stringify(mockGlobalConfig);
      }
      if (filePath === mockProjectConfigPath) {
        return JSON.stringify(mockProjectConfig);
      }
      return '';
    });
  });

  // Only test the core function that's actually testable
  it('should read config files correctly', () => {
    const globalConfig = readConfigFile(mockGlobalConfigPath);
    expect(globalConfig).toEqual(mockGlobalConfig);

    const projectConfig = readConfigFile(mockProjectConfigPath);
    expect(projectConfig).toEqual(mockProjectConfig);
  });
});
