import * as fs from 'fs/promises';

import chalk from 'chalk';
import {
  toolAgent,
  Logger,
  getTools,
  getProviderApiKeyError,
  providerConfig,
  userPrompt,
  LogLevel,
  subAgentTool,
  errorToString,
  DEFAULT_CONFIG,
  AgentConfig,
  ModelProvider,
  BackgroundTools,
} from 'mycoder-agent';
import { TokenTracker } from 'mycoder-agent/dist/core/tokens.js';

import { SharedOptions } from '../options.js';
import { captureException } from '../sentry/index.js';
import { getConfigFromArgv, loadConfig } from '../settings/config.js';
import { checkGitCli } from '../utils/gitCliCheck.js';
import { nameToLogIndex } from '../utils/nameToLogIndex.js';
import { checkForUpdates, getPackageInfo } from '../utils/versionCheck.js';

import type { CommandModule, Argv } from 'yargs';

interface DefaultArgs extends SharedOptions {
  prompt?: string;
}

export const command: CommandModule<SharedOptions, DefaultArgs> = {
  command: '* [prompt]',
  describe: 'Execute a prompt or start interactive mode',
  builder: (yargs: Argv<object>): Argv<DefaultArgs> => {
    return yargs.positional('prompt', {
      type: 'string',
      description: 'The prompt to execute',
    }) as Argv<DefaultArgs>;
  },
  handler: async (argv) => {
    const packageInfo = getPackageInfo();

    // Get configuration for model provider and name
    const config = await loadConfig(getConfigFromArgv(argv));

    const logger = new Logger({
      name: 'Default',
      logLevel: nameToLogIndex(config.logLevel),
      customPrefix: subAgentTool.logPrefix,
    });

    logger.info(
      `MyCoder v${packageInfo.version} - AI-powered coding assistant`,
    );

    // Skip version check if upgradeCheck is false
    if (config.upgradeCheck !== false) {
      await checkForUpdates(logger);
    }

    // Check for git and gh CLI tools if GitHub mode is enabled
    if (config.githubMode) {
      logger.debug(
        'GitHub mode is enabled, checking for git and gh CLI tools...',
      );
      const gitCliCheck = await checkGitCli(logger);

      if (gitCliCheck.errors.length > 0) {
        logger.warn(
          'GitHub mode is enabled but there are issues with git/gh CLI tools:',
        );
        gitCliCheck.errors.forEach((error) => logger.warn(`- ${error}`));

        if (!gitCliCheck.gitAvailable || !gitCliCheck.ghAvailable) {
          logger.warn(
            'GitHub mode requires git and gh CLI tools to be installed.',
          );
          logger.warn(
            'Please install the missing tools or disable GitHub mode with --githubMode false',
          );
          // Disable GitHub mode if git or gh CLI is not available
          logger.info('Disabling GitHub mode due to missing CLI tools.');
          config.githubMode = false;
        } else if (!gitCliCheck.ghAuthenticated) {
          logger.warn(
            'GitHub CLI is not authenticated. Please run "gh auth login" to authenticate.',
          );
          // Disable GitHub mode if gh CLI is not authenticated
          logger.info(
            'Disabling GitHub mode due to unauthenticated GitHub CLI.',
          );
          config.githubMode = false;
        }
      } else {
        logger.info(
          'GitHub mode is enabled and all required CLI tools are available.',
        );
      }
    }

    const tokenTracker = new TokenTracker(
      'Root',
      undefined,
      config.tokenUsage ? LogLevel.info : LogLevel.debug,
    );
    // Use command line option if provided, otherwise use config value
    tokenTracker.tokenCache = config.tokenCache;

    try {
      // Early API key check based on model provider
      const providerSettings =
        providerConfig[config.provider as keyof typeof providerConfig];

      if (providerSettings) {
        const { keyName } = providerSettings;

        // First check if the API key is in the config
        const configApiKey = config[keyName as keyof typeof config] as string;
        // Then fall back to environment variable
        const envApiKey = process.env[keyName];
        // Use config key if available, otherwise use env key
        const apiKey = configApiKey || envApiKey;

        if (!apiKey) {
          logger.error(getProviderApiKeyError(config.provider));
          throw new Error(`${config.provider} API key not found`);
        }

        // If we're using a key from config, set it as an environment variable
        // This ensures it's available to the provider libraries
        if (configApiKey && !envApiKey) {
          process.env[keyName] = configApiKey;
          logger.info(`Using ${keyName} from configuration`);
        }
      } else if (config.provider === 'ollama') {
        // For Ollama, we check if the base URL is set
        const ollamaBaseUrl = argv.ollamaBaseUrl || config.ollamaBaseUrl;
        logger.info(`Using Ollama with base URL: ${ollamaBaseUrl}`);
      } else {
        // Unknown provider
        logger.info(`Unknown provider: ${config.provider}`);
        throw new Error(`Unknown provider: ${config.provider}`);
      }

      let prompt: string | undefined;

      // If promptFile is specified, read from file
      if (argv.file) {
        prompt = await fs.readFile(argv.file, 'utf-8');
      }

      // If interactive mode
      if (argv.interactive) {
        prompt = await userPrompt(
          "Type your request below or 'help' for usage information. Use Ctrl+C to exit.",
        );
      } else if (!prompt) {
        // Use command line prompt if provided
        prompt = argv.prompt;
      }

      if (!prompt) {
        logger.error(
          'No prompt provided. Either specify a prompt, use --promptFile, or run in --interactive mode.',
        );
        throw new Error('No prompt provided');
      }

      // Add the standard suffix to all prompts
      prompt += [
        'Please ask for clarifications if required or if the tasks is confusing.',
        "If you need more context, don't be scared to create a sub-agent to investigate and generate report back, this can save a lot of time and prevent obvious mistakes.",
        'Once the task is complete ask the user, via the userPrompt tool if the results are acceptable or if changes are needed or if there are additional follow on tasks.',
      ].join('\n');

      const tools = getTools({
        userPrompt: config.userPrompt,
      });

      // Error handling
      process.on('SIGINT', () => {
        logger.log(
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
        logger,
        headless: config.headless,
        userSession: config.userSession,
        pageFilter: config.pageFilter,
        workingDirectory: '.',
        tokenTracker,
        githubMode: config.githubMode,
        customPrompt: config.customPrompt,
        tokenCache: config.tokenCache,
        userPrompt: config.userPrompt,
        provider: config.provider as ModelProvider,
        model: config.model,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        backgroundTools: new BackgroundTools('mainAgent'),
      });

      const output =
        typeof result.result === 'string'
          ? result.result
          : JSON.stringify(result.result, null, 2);
      logger.info('\n=== Result ===\n', output);
    } catch (error) {
      logger.error(
        'An error occurred:',
        errorToString(error),
        error instanceof Error ? error.stack : '',
      );
      // Capture the error with Sentry
      captureException(error);
    }

    logger.log(
      tokenTracker.logLevel,
      chalk.blueBright(`[Token Usage Total] ${tokenTracker.toString()}`),
    );
  },
};
