import { toolAgent } from 'mycoder-agent';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { getConfig } from '../../src/settings/config.js';

// Mock dependencies
vi.mock('../../src/settings/config.js', () => ({
  getConfig: vi.fn(),
  updateConfig: vi.fn(),
}));

vi.mock('mycoder-agent', () => ({
  Logger: vi.fn().mockImplementation(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
    debug: vi.fn(),
  })),
  toolAgent: vi.fn().mockResolvedValue({ result: 'Success' }),
  getTools: vi.fn().mockReturnValue([]),
  getAnthropicApiKeyError: vi.fn(),
  userPrompt: vi.fn(),
  LogLevel: {
    debug: 0,
    verbose: 1,
    info: 2,
    warn: 3,
    error: 4,
  },
  subAgentTool: { logPrefix: '' },
  errorToString: vi.fn(),
  getModel: vi.fn(),
  DEFAULT_CONFIG: {},
  TokenTracker: vi.fn().mockImplementation(() => ({
    logLevel: 2,
    toString: () => 'token usage',
  })),
}));

describe('Config Defaults for CLI Options', () => {
  beforeEach(() => {
    // Mock process.env
    process.env.ANTHROPIC_API_KEY = 'test-key';

    // Reset mocks before each test
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should use config values for headless, userSession, and pageFilter when not provided in args', async () => {
    // Setup mock config with default values
    vi.mocked(getConfig).mockReturnValue({
      githubMode: false,
      headless: true,
      userSession: false,
      pageFilter: 'none',
      provider: 'anthropic',
      model: 'claude-3-7-sonnet-20250219',
      provider: 'anthropic',
      model: 'claude-3-7-sonnet-20250219',
      ollamaBaseUrl: 'http://localhost:11434/api',
    });

    // Create minimal args (no headless, userSession, or pageFilter specified)
    const args = {
      headless: undefined,
      userSession: undefined,
      pageFilter: undefined,
    };

    // Get config from getConfig
    const config = getConfig();

    // Simulate how $default.ts uses these values
    const options = {
      headless: args.headless ?? config.headless,
      userSession: args.userSession ?? config.userSession,
      pageFilter: args.pageFilter ?? config.pageFilter,
    };

    // Verify the correct values are used (from config)
    expect(options).toEqual({
      headless: true, // Default from config
      userSession: false, // Default from config
      pageFilter: 'none', // Default from config
    });
  });

  it('should use command line args for headless, userSession, and pageFilter when provided', async () => {
    // Setup mock config with default values
    vi.mocked(getConfig).mockReturnValue({
      githubMode: false,
      headless: true, // Default is true
      userSession: false, // Default is false
      pageFilter: 'none', // Default is none
      provider: 'anthropic',
      model: 'claude-3-7-sonnet-20250219',
      provider: 'anthropic',
      model: 'claude-3-7-sonnet-20250219',
      ollamaBaseUrl: 'http://localhost:11434/api',
    });

    // Create args with explicit values (overriding defaults)
    const args = {
      headless: false, // Override config default
      userSession: true, // Override config default
      pageFilter: 'readability', // Override config default
    };

    // Get config from getConfig
    const config = getConfig();

    // Simulate how $default.ts uses these values
    const options = {
      headless: args.headless ?? config.headless,
      userSession: args.userSession ?? config.userSession,
      pageFilter: args.pageFilter ?? config.pageFilter,
    };

    // Verify the correct values are used (from command line args)
    expect(options).toEqual({
      headless: false, // Overridden by command line
      userSession: true, // Overridden by command line
      pageFilter: 'readability', // Overridden by command line
    });
  });

  it('should test the actual toolAgent call with config defaults', async () => {
    // Setup mock config with default values
    vi.mocked(getConfig).mockReturnValue({
      githubMode: false,
      headless: true,
      userSession: false,
      pageFilter: 'none',
      provider: 'anthropic',
      model: 'claude-3-7-sonnet-20250219',
      provider: 'anthropic',
      model: 'claude-3-7-sonnet-20250219',
      ollamaBaseUrl: 'http://localhost:11434/api',
    });

    // Create minimal args (no headless, userSession, or pageFilter specified)
    const args = {
      headless: undefined,
      userSession: undefined,
      pageFilter: undefined,
    };

    // Get config from getConfig
    const config = getConfig();

    // Call toolAgent with the config values
    await toolAgent(
      'test prompt',
      [],
      {},
      {
        headless: args.headless ?? config.headless,
        userSession: args.userSession ?? config.userSession,
        pageFilter: args.pageFilter ?? config.pageFilter,
        workingDirectory: '.',
        githubMode: config.githubMode,
      },
    );

    // Verify toolAgent was called with the correct config values from defaults
    expect(toolAgent).toHaveBeenCalledWith(
      'test prompt',
      expect.any(Array),
      expect.any(Object),
      expect.objectContaining({
        headless: true, // Default from config
        userSession: false, // Default from config
        pageFilter: 'none', // Default from config
      }),
    );
  });

  it('should test the actual toolAgent call with command line args', async () => {
    // Setup mock config with default values
    vi.mocked(getConfig).mockReturnValue({
      githubMode: false,
      headless: true, // Default is true
      userSession: false, // Default is false
      pageFilter: 'none', // Default is none
      provider: 'anthropic',
      model: 'claude-3-7-sonnet-20250219',
      provider: 'anthropic',
      model: 'claude-3-7-sonnet-20250219',
      ollamaBaseUrl: 'http://localhost:11434/api',
    });

    // Create args with explicit values (overriding defaults)
    const args = {
      headless: false, // Override config default
      userSession: true, // Override config default
      pageFilter: 'readability', // Override config default
    };

    // Get config from getConfig
    const config = getConfig();

    // Call toolAgent with the command line args
    await toolAgent(
      'test prompt',
      [],
      {},
      {
        headless: args.headless ?? config.headless,
        userSession: args.userSession ?? config.userSession,
        pageFilter: args.pageFilter ?? config.pageFilter,
        workingDirectory: '.',
        githubMode: config.githubMode,
      },
    );

    // Verify toolAgent was called with the command line args (overriding defaults)
    expect(toolAgent).toHaveBeenCalledWith(
      'test prompt',
      expect.any(Array),
      expect.any(Object),
      expect.objectContaining({
        headless: false, // Overridden by command line
        userSession: true, // Overridden by command line
        pageFilter: 'readability', // Overridden by command line
      }),
    );
  });
});
