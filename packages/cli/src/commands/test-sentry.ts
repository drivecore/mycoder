import chalk from 'chalk';
import { consoleOutputLogger, Logger } from 'mycoder-agent';

import { SharedOptions } from '../options.js';
import { testSentryErrorReporting } from '../sentry/index.js';
import { nameToLogIndex } from '../utils/nameToLogIndex.js';

import type { CommandModule } from 'yargs';

type TestSentryArgs = SharedOptions;

export const command: CommandModule<SharedOptions, TestSentryArgs> = {
  command: 'test-sentry',
  describe: false, // Hide from help output
  handler: async (argv) => {
    const logger = new Logger({
      name: 'TestSentry',
      logLevel: nameToLogIndex(argv.logLevel),
    });
    logger.listeners.push(consoleOutputLogger);

    logger.info(chalk.yellow('Testing Sentry.io error reporting...'));

    try {
      // Test error reporting
      const error = testSentryErrorReporting();

      logger.info(
        chalk.green('Successfully sent test error to Sentry.io:'),
        chalk.red(error instanceof Error ? error.message : String(error)),
      );

      logger.info(
        chalk.blue('Note:'),
        'If this is a development environment, the error may not be sent to Sentry unless ENABLE_SENTRY=true is set.',
      );
    } catch (error) {
      logger.error('Failed to test Sentry error reporting:', error);
    }
  },
};
