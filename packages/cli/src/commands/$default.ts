import * as fs from 'fs/promises';
import { createInterface } from 'readline/promises';

import chalk from 'chalk';
import {
  toolAgent,
  Logger,
  getTools,
  getAnthropicApiKeyError,
  userPrompt,
  LogLevel,
  subAgentTool,
  errorToString,
  getModel,
  DEFAULT_CONFIG,
} from 'mycoder-agent';
import { TokenTracker } from 'mycoder-agent/dist/core/tokens.js';

import { SharedOptions } from '../options.js';
import { initSentry, captureException } from '../sentry/index.js';
import { getConfig } from '../settings/config.js';
import { hasUserConsented, saveUserConsent } from '../settings/settings.js';
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
    // Initialize Sentry with custom DSN if provided
    if (argv.sentryDsn) {
      initSentry(argv.sentryDsn);
    }

    const logger = new Logger({
      name: 'Default',
      logLevel: nameToLogIndex(argv.logLevel),
      customPrefix: subAgentTool.logPrefix,
    });

    const packageInfo = getPackageInfo();

    logger.info(
      `MyCoder v${packageInfo.version} - AI-powered coding assistant`,
    );

    await checkForUpdates(logger);

    if (!hasUserConsented()) {
      const readline = createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      logger.warn(
        'This tool can do anything on your command line that you ask it to.',
        'It can delete files, install software, and even send data to remote servers.',
        'It is a powerful tool that should be used with caution.',
        'Do you consent to using this tool at your own risk? (y/N)',
      );

      const answer = (await readline.question('> ')).trim().toLowerCase();
      readline.close();

      if (answer === 'y' || answer === 'yes') {
        saveUserConsent();
      } else {
        logger.info('User did not consent. Exiting.');
        throw new Error('User did not consent');
      }
    }

    const tokenTracker = new TokenTracker(
      'Root',
      undefined,
      argv.tokenUsage ? LogLevel.info : LogLevel.debug,
    );

    try {
      // Get configuration for model provider and name
      const userConfig = getConfig();
      const userModelProvider = argv.modelProvider || userConfig.modelProvider;
      const userModelName = argv.modelName || userConfig.modelName;

      // Early API key check based on model provider
      if (userModelProvider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
        logger.error(getAnthropicApiKeyError());
        throw new Error('Anthropic API key not found');
      } else if (
        userModelProvider === 'openai' &&
        !process.env.OPENAI_API_KEY
      ) {
        logger.error(
          'No OpenAI API key found. Please set the OPENAI_API_KEY environment variable.',
          'You can get an API key from https://platform.openai.com/api-keys',
        );
        throw new Error('OpenAI API key not found');
      }
      // No API key check needed for Ollama as it uses a local server

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

      const tools = getTools();

      // Error handling
      process.on('SIGINT', () => {
        logger.log(
          tokenTracker.logLevel,
          chalk.blueBright(`[Token Usage Total] ${tokenTracker.toString()}`),
        );
        process.exit(0);
      });
      const config = await getConfig();

      // Create a config with the selected model
      const agentConfig = {
        ...DEFAULT_CONFIG,
        model: getModel(
          userModelProvider as 'anthropic' | 'openai' | 'ollama',
          userModelName,
          { ollamaBaseUrl: config.ollamaBaseUrl },
        ),
      };

      const result = await toolAgent(prompt, tools, agentConfig, {
        logger,
        headless: argv.headless ?? config.headless,
        userSession: argv.userSession ?? config.userSession,
        pageFilter: argv.pageFilter ?? config.pageFilter,
        workingDirectory: '.',
        tokenTracker,
        githubMode: config.githubMode,
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
