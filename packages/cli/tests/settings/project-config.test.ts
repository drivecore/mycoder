import * as fs from 'fs';
import * as path from 'path';

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { getProjectConfigFile } from '../../src/settings/config.js';
import { getProjectSettingsDir } from '../../src/settings/settings.js';

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  statSync: vi.fn(),
}));

// Mock path module
vi.mock('path', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    parse: vi.fn(),
  };
});

// Only mock specific functions from settings.js
vi.mock('../../src/settings/settings.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getProjectSettingsDir: vi.fn(),
  };
});

describe('Project Config File', () => {
  const mockCwd = '/mock/project/dir';
  const mockProjectDir = path.join(mockCwd, '.mycoder');
  const expectedConfigFile = path.join(mockProjectDir, 'config.json');

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Mock process.cwd()
    vi.spyOn(process, 'cwd').mockReturnValue(mockCwd);
    
    // Mock path.parse
    vi.mocked(path.parse).mockReturnValue({
      root: '/',
      dir: '/mock',
      base: 'dir',
      name: 'dir',
      ext: '',
    });
    
    // Default mock for existsSync
    vi.mocked(fs.existsSync).mockReturnValue(false);
    
    // Default mock for statSync
    vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => true,
    } as unknown as fs.Stats);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return project config file path in current directory', () => {
    // Mock getProjectSettingsDir to return the project dir
    vi.mocked(getProjectSettingsDir).mockReturnValue(mockProjectDir);
    
    const result = getProjectConfigFile();
    
    expect(result).toBe(expectedConfigFile);
  });

  it('should create project directory if it does not exist', () => {
    // Mock getProjectSettingsDir to return the project dir
    vi.mocked(getProjectSettingsDir).mockReturnValue(mockProjectDir);
    
    // Mock directory does not exist
    vi.mocked(fs.existsSync).mockReturnValue(false);
    
    getProjectConfigFile();
    
    // Verify directory creation was attempted
    expect(fs.mkdirSync).toHaveBeenCalledWith(mockProjectDir, { recursive: true });
  });

  it('should not create project directory if it already exists', () => {
    // Mock getProjectSettingsDir to return the project dir
    vi.mocked(getProjectSettingsDir).mockReturnValue(mockProjectDir);
    
    // Mock directory already exists
    vi.mocked(fs.existsSync).mockReturnValue(true);
    
    getProjectConfigFile();
    
    // Verify directory creation was not attempted
    expect(fs.mkdirSync).not.toHaveBeenCalled();
  });

  it('should return empty string if project directory cannot be determined', () => {
    // Mock getProjectSettingsDir to return empty string (error case)
    vi.mocked(getProjectSettingsDir).mockReturnValue('');
    
    const result = getProjectConfigFile();
    
    expect(result).toBe('');
  });
});