import chalk from 'chalk';
import {
  toolAgent,
  Logger,
  getTools,
  getProviderApiKeyError,
  providerConfig,
  LogLevel,
  errorToString,
  DEFAULT_CONFIG,
  AgentConfig,
  ModelProvider,
  BackgroundTools,
} from 'mycoder-agent';
import { TokenTracker } from 'mycoder-agent/dist/core/tokens.js';

import { captureException } from '../sentry/index.js';

import { GitHubService } from './github.service.js';
import { VersionService } from './version.service.js';

import type { Config } from '../settings/config.js';

/**
 * Service for executing commands
 * Handles the core logic of executing prompts with the AI agent
 */
export class CommandService {
  private logger: Logger;
  private config: Config;
  private versionService: VersionService;
  private githubService: GitHubService;

  /**
   * Create a new CommandService
   * @param logger Logger instance
   * @param config Application configuration
   * @param versionService Version service for update checks
   * @param githubService GitHub service for GitHub mode validation
   */
  constructor(
    logger: Logger,
    config: Config,
    versionService: VersionService,
    githubService: GitHubService,
  ) {
    this.logger = logger;
    this.config = config;
    this.versionService = versionService;
    this.githubService = githubService;
  }

  /**
   * Execute a prompt with the AI agent
   * @param prompt The prompt to execute
   * @returns Promise that resolves when execution is complete
   */
  async execute(prompt: string): Promise<void> {
    const packageInfo = this.versionService.getPackageInfo();

    this.logger.info(
      `MyCoder v${packageInfo.version} - AI-powered coding assistant`,
    );

    // Check for updates if enabled
    await this.versionService.checkForUpdates();

    // Validate GitHub mode if enabled
    if (this.config.githubMode) {
      this.config.githubMode = await this.githubService.validateGitHubMode();
    }

    const tokenTracker = new TokenTracker(
      'Root',
      undefined,
      this.config.tokenUsage ? LogLevel.info : LogLevel.debug,
    );
    // Use command line option if provided, otherwise use config value
    tokenTracker.tokenCache = this.config.tokenCache;

    const backgroundTools = new BackgroundTools('mainAgent');

    try {
      await this.executeWithAgent(prompt, tokenTracker, backgroundTools);
    } catch (error) {
      this.logger.error(
        'An error occurred:',
        errorToString(error),
        error instanceof Error ? error.stack : '',
      );
      // Capture the error with Sentry
      captureException(error);
    } finally {
      await backgroundTools.cleanup();
    }

    this.logger.log(
      tokenTracker.logLevel,
      chalk.blueBright(`[Token Usage Total] ${tokenTracker.toString()}`),
    );
  }

  /**
   * Execute the prompt with the AI agent
   * @param prompt The prompt to execute
   * @param tokenTracker Token usage tracker
   * @param backgroundTools Background tools manager
   */
  private async executeWithAgent(
    prompt: string,
    tokenTracker: TokenTracker,
    backgroundTools: BackgroundTools,
  ): Promise<void> {
    // Early API key check based on model provider
    const providerSettings =
      providerConfig[this.config.provider as keyof typeof providerConfig];

    if (!providerSettings) {
      // Unknown provider
      this.logger.info(`Unknown provider: ${this.config.provider}`);
      throw new Error(`Unknown provider: ${this.config.provider}`);
    }

    const { keyName } = providerSettings;
    let apiKey: string | undefined = undefined;
    if (keyName) {
      // Then fall back to environment variable
      apiKey = process.env[keyName];
      if (!apiKey) {
        this.logger.error(getProviderApiKeyError(this.config.provider));
        throw new Error(`${this.config.provider} API key not found`);
      }
    }

    this.logger.info(`LLM: ${this.config.provider}/${this.config.model}`);
    if (this.config.baseUrl) {
      // For Ollama, we check if the base URL is set
      this.logger.info(`Using base url: ${this.config.baseUrl}`);
    }
    console.log();

    // Add the standard suffix to all prompts
    prompt += [
      'Please ask for clarifications if required or if the tasks is confusing.',
      "If you need more context, don't be scared to create a sub-agent to investigate and generate report back, this can save a lot of time and prevent obvious mistakes.",
      'Once the task is complete ask the user, via the userPrompt tool if the results are acceptable or if changes are needed or if there are additional follow on tasks.',
    ].join('\\n');

    const tools = getTools({
      userPrompt: this.config.userPrompt,
      mcpConfig: this.config.mcp,
    });

    // Error handling
    process.on('SIGINT', () => {
      this.logger.log(
        tokenTracker.logLevel,
        chalk.blueBright(`[Token Usage Total] ${tokenTracker.toString()}`),
      );
      process.exit(0);
    });

    // Create a config for the agent
    const agentConfig: AgentConfig = {
      ...DEFAULT_CONFIG,
    };

    const result = await toolAgent(prompt, tools, agentConfig, {
      logger: this.logger,
      headless: this.config.headless,
      userSession: this.config.userSession,
      pageFilter: this.config.pageFilter,
      workingDirectory: '.',
      tokenTracker,
      githubMode: this.config.githubMode,
      customPrompt: this.config.customPrompt,
      tokenCache: this.config.tokenCache,
      userPrompt: this.config.userPrompt,
      provider: this.config.provider as ModelProvider,
      baseUrl: this.config.baseUrl,
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
      backgroundTools,
      apiKey,
    });

    const output =
      typeof result.result === 'string'
        ? result.result
        : JSON.stringify(result.result, null, 2);
    this.logger.info('\\n=== Result ===\\n', output);
  }
}
