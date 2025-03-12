import * as path from 'path';

import chalk from 'chalk';
import { Logger } from 'mycoder-agent';

import { SharedOptions } from '../options.js';
import { createDefaultConfigFile } from '../settings/config-loader.js';
import { nameToLogIndex } from '../utils/nameToLogIndex.js';

import type { CommandModule, ArgumentsCamelCase } from 'yargs';

export interface InitOptions extends SharedOptions {
  force: boolean;
}

export const command: CommandModule<SharedOptions, InitOptions> = {
  command: 'init',
  describe: 'Initialize a new MyCoder configuration file',
  builder: (yargs) => {
    return yargs
      .option('force', {
        alias: 'f',
        describe: 'Overwrite existing configuration file if it exists',
        type: 'boolean',
        default: false,
      })
      .example('$0 init', 'Create a default mycoder.config.js file')
      .example('$0 init --force', 'Overwrite existing configuration file');
  },
  handler: async (argv: ArgumentsCamelCase<InitOptions>) => {
    const logger = new Logger({
      name: 'Init',
      logLevel: nameToLogIndex(argv.logLevel),
    });

    const configPath = path.join(process.cwd(), 'mycoder.config.js');

    try {
      // If force flag is set, delete existing file
      if (argv.force) {
        const fs = await import('fs');
        if (fs.existsSync(configPath)) {
          fs.unlinkSync(configPath);
        }
      }

      // Create default configuration file
      const created = createDefaultConfigFile(configPath);

      if (created) {
        logger.info(chalk.green(`Created configuration file: ${configPath}`));
        logger.info('Edit this file to customize MyCoder settings.');
      } else {
        logger.error(
          chalk.red(`Configuration file already exists: ${configPath}`),
        );
        logger.info('Use --force to overwrite the existing file.');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        chalk.red(`Failed to create configuration file: ${errorMessage}`),
      );
    }
  },
};
