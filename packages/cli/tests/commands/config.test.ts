import { Logger } from 'mycoder-agent';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { command } from '../../src/commands/config.js';
import {
  getConfig,
  getDefaultConfig,
  updateConfig,
  getConfigAtLevel,
  clearConfigAtLevel,
  clearConfigKey,
} from '../../src/settings/config.js';

// Mock dependencies
vi.mock('../../src/settings/config.js', () => ({
  getConfig: vi.fn(),
  getDefaultConfig: vi.fn(),
  updateConfig: vi.fn(),
  getConfigAtLevel: vi.fn(),
  clearConfigAtLevel: vi.fn(),
  clearConfigKey: vi.fn(),
  ConfigLevel: {
    DEFAULT: 'default',
    GLOBAL: 'global',
    PROJECT: 'project',
    CLI: 'cli',
  },
}));

vi.mock('mycoder-agent', () => ({
  Logger: vi.fn().mockImplementation(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  })),
  LogLevel: {
    debug: 0,
    verbose: 1,
    info: 2,
    warn: 3,
    error: 4,
  },
}));

vi.mock('../../src/utils/nameToLogIndex.js', () => ({
  nameToLogIndex: vi.fn().mockReturnValue(2), // info level
}));

// Mock readline/promises
vi.mock('readline/promises', () => ({
  createInterface: vi.fn().mockImplementation(() => ({
    question: vi.fn().mockResolvedValue('y'),
    close: vi.fn(),
  })),
}));

describe('Config Command', () => {
  let mockLogger: {
    info: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    };
    vi.mocked(Logger).mockImplementation(() => mockLogger as unknown as Logger);
    vi.mocked(getConfig).mockReturnValue({ githubMode: false });
    vi.mocked(getDefaultConfig).mockReturnValue({
      githubMode: false,
      customPrompt: '',
    });
    vi.mocked(updateConfig).mockImplementation((config) => ({
      githubMode: false,
      ...config,
    }));
    vi.mocked(getConfigAtLevel).mockReturnValue({});
    vi.mocked(clearConfigKey).mockImplementation(() => ({ githubMode: false }));
    vi.mocked(clearConfigKey).mockImplementation(() => ({ githubMode: false }));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should list all configuration values', async () => {
    await command.handler!({
      _: ['config', 'list'],
      logLevel: 'info',
      interactive: false,
      command: 'list',
      global: false,
      g: false,
    } as any);

    expect(getConfig).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith('Current configuration:');
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('githubMode'),
    );
  });

  it('should filter out invalid config keys in list command', async () => {
    // Mock getConfig to return config with invalid keys
    vi.mocked(getConfig).mockReturnValue({
      githubMode: false,
      invalidKey: 'some value',
    } as any);

    // Mock getDefaultConfig to return only valid keys
    vi.mocked(getDefaultConfig).mockReturnValue({
      githubMode: false,
    });

    await command.handler!({
      _: ['config', 'list'],
      logLevel: 'info',
      interactive: false,
      command: 'list',
      global: false,
      g: false,
    } as any);

    expect(getConfig).toHaveBeenCalled();
    expect(getDefaultConfig).toHaveBeenCalled();

    // Should show the valid key
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('githubMode'),
    );

    // Should not show the invalid key
    const infoCallArgs = mockLogger.info.mock.calls.flat();
    expect(infoCallArgs.join()).not.toContain('invalidKey');
  });

  it('should get a configuration value', async () => {
    await command.handler!({
      _: ['config', 'get', 'githubMode'],
      logLevel: 'info',
      interactive: false,
      command: 'get',
      key: 'githubMode',
      global: false,
      g: false,
    } as any);

    expect(getConfig).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('githubMode'),
    );
  });

  it('should show error when getting non-existent key', async () => {
    await command.handler!({
      _: ['config', 'get', 'nonExistentKey'],
      logLevel: 'info',
      interactive: false,
      command: 'get',
      key: 'nonExistentKey',
      global: false,
      g: false,
    } as any);

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('not found'),
    );
  });

  it('should set a configuration value', async () => {
    await command.handler!({
      _: ['config', 'set', 'githubMode', 'true'],
      logLevel: 'info',
      interactive: false,
      command: 'set',
      key: 'githubMode',
      value: 'true',
      global: false,
      g: false,
    } as any);

    expect(updateConfig).toHaveBeenCalledWith({ githubMode: true }, 'project');
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Updated'),
    );
  });

  it('should handle missing key for set command', async () => {
    await command.handler!({
      _: ['config', 'set'],
      logLevel: 'info',
      interactive: false,
      command: 'set',
      key: undefined,
      global: false,
      g: false,
    } as any);

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Key is required'),
    );
  });

  it('should handle missing value for set command', async () => {
    await command.handler!({
      _: ['config', 'set', 'githubMode'],
      logLevel: 'info',
      interactive: false,
      command: 'set',
      key: 'githubMode',
      value: undefined,
      global: false,
      g: false,
    } as any);

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Value is required'),
    );
  });

  it('should warn when setting non-standard key', async () => {
    // Mock getDefaultConfig to return config without the key
    vi.mocked(getDefaultConfig).mockReturnValue({
      customPrompt: '',
    });

    await command.handler!({
      _: ['config', 'set', 'nonStandardKey', 'value'],
      logLevel: 'info',
      interactive: false,
      command: 'set',
      key: 'nonStandardKey',
      value: 'value',
      global: false,
      g: false,
    } as any);

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('not a standard configuration key'),
    );
    // Should still update the config
    expect(updateConfig).toHaveBeenCalled();
  });

  it('should clear a configuration value', async () => {
    // Mock getConfig to include the key we want to clear
    vi.mocked(getConfig).mockReturnValue({
      githubMode: false,
      customPrompt: 'custom value',
    });

    // Mock getDefaultConfig to include the key we want to clear
    vi.mocked(getDefaultConfig).mockReturnValue({
      githubMode: false,
      customPrompt: '',
    });

    await command.handler!({
      _: ['config', 'clear', 'customPrompt'],
      logLevel: 'info',
      interactive: false,
      command: 'clear',
      key: 'customPrompt',
      global: false,
      g: false,
      all: false,
    } as any);

    // Verify success message
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Cleared customPrompt'),
    );
  });

  it('should handle missing key for clear command', async () => {
    await command.handler!({
      _: ['config', 'clear'],
      logLevel: 'info',
      interactive: false,
      command: 'clear',
      key: undefined,
      global: false,
      g: false,
      all: false,
    } as any);

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Key is required'),
    );
  });

  it('should clear all project configuration with --all flag', async () => {
    await command.handler!({
      _: ['config', 'clear'],
      logLevel: 'info',
      interactive: false,
      command: 'clear',
      all: true,
      global: false,
      g: false,
    } as any);

    expect(clearConfigAtLevel).toHaveBeenCalledWith('project');
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining(
        'project configuration settings have been cleared',
      ),
    );
  });

  it('should clear all global configuration with --all --global flags', async () => {
    await command.handler!({
      _: ['config', 'clear'],
      logLevel: 'info',
      interactive: false,
      command: 'clear',
      all: true,
      global: true,
      g: false,
    } as any);

    expect(clearConfigAtLevel).toHaveBeenCalledWith('global');
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining(
        'global configuration settings have been cleared',
      ),
    );
  });

  it('should handle non-existent key for clear command', async () => {
    vi.mocked(getConfig).mockReturnValue({
      githubMode: false,
    });

    await command.handler!({
      _: ['config', 'clear', 'nonExistentKey'],
      logLevel: 'info',
      interactive: false,
      command: 'clear',
      key: 'nonExistentKey',
      global: false,
      g: false,
      all: false,
    } as any);

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('not found'),
    );
  });

  it('should handle unknown command', async () => {
    await command.handler!({
      _: ['config', 'unknown'],
      logLevel: 'info',
      interactive: false,
      command: 'unknown' as any,
      global: false,
      g: false,
    } as any);

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Unknown config command'),
    );
  });

  it('should list all configuration values with default indicators', async () => {
    // Mock getConfig to return a mix of default and custom values
    vi.mocked(getConfig).mockReturnValue({
      githubMode: false, // default value
      customPrompt: 'custom value', // custom value
    });

    // Mock getDefaultConfig to return the default values
    vi.mocked(getDefaultConfig).mockReturnValue({
      githubMode: false,
      customPrompt: '',
    });

    await command.handler!({
      _: ['config', 'list'],
      logLevel: 'info',
      interactive: false,
      command: 'list',
      global: false,
      g: false,
    } as any);

    expect(getConfig).toHaveBeenCalled();
    expect(getDefaultConfig).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith('Current configuration:');

    // Check for default indicator
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('githubMode') &&
        expect.stringContaining('(default)'),
    );

    // Check for custom value
    const infoCallArgs = mockLogger.info.mock.calls.flat();
    const customPromptCall = infoCallArgs.find(
      (arg) => typeof arg === 'string' && arg.includes('customPrompt'),
    );
    expect(customPromptCall).toBeDefined();
    expect(customPromptCall).not.toContain('(default)');
  });

  it('should use global config when --global flag is provided', async () => {
    await command.handler!({
      _: ['config', 'set', 'githubMode', 'true'],
      logLevel: 'info',
      interactive: false,
      command: 'set',
      key: 'githubMode',
      value: 'true',
      global: true,
      g: false,
    } as any);

    expect(updateConfig).toHaveBeenCalledWith({ githubMode: true }, 'global');
  });

  it('should use global config when -g flag is provided', async () => {
    await command.handler!({
      _: ['config', 'set', 'githubMode', 'true'],
      logLevel: 'info',
      interactive: false,
      command: 'set',
      key: 'githubMode',
      value: 'true',
      global: false,
      g: true,
    } as any);

    expect(updateConfig).toHaveBeenCalledWith({ githubMode: true }, 'global');
  });
});
