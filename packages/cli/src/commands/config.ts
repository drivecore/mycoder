import chalk from 'chalk';
import { Logger } from 'mycoder-agent';

import { SharedOptions } from '../options.js';
import {
  getConfig,
  getDefaultConfig,
  updateConfig,
} from '../settings/config.js';
import { nameToLogIndex } from '../utils/nameToLogIndex.js';

import type { CommandModule, ArgumentsCamelCase } from 'yargs';

export interface ConfigOptions extends SharedOptions {
  command: 'get' | 'set' | 'list' | 'clear';
  key?: string;
  value?: string;
}

export const command: CommandModule<SharedOptions, ConfigOptions> = {
  command: 'config <command> [key] [value]',
  describe: 'Manage MyCoder configuration',
  builder: (yargs) => {
    return yargs
      .positional('command', {
        describe: 'Config command to run',
        choices: ['get', 'set', 'list', 'clear'],
        type: 'string',
        demandOption: true,
      })
      .positional('key', {
        describe: 'Configuration key',
        type: 'string',
      })
      .positional('value', {
        describe: 'Configuration value (for set command)',
        type: 'string',
      })
      .example('$0 config list', 'List all configuration values')
      .example(
        '$0 config get githubMode',
        'Get the value of githubMode setting',
      )
      .example('$0 config set githubMode true', 'Enable GitHub mode')
      .example(
        '$0 config clear customPrompt',
        'Reset customPrompt to default value',
      ) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  },
  handler: async (argv: ArgumentsCamelCase<ConfigOptions>) => {
    const logger = new Logger({
      name: 'Config',
      logLevel: nameToLogIndex(argv.logLevel),
    });

    const config = getConfig();

    // Handle 'list' command
    if (argv.command === 'list') {
      logger.info('Current configuration:');
      const defaultConfig = getDefaultConfig();
      Object.entries(config).forEach(([key, value]) => {
        const isDefault =
          JSON.stringify(value) ===
          JSON.stringify(defaultConfig[key as keyof typeof defaultConfig]);
        const valueDisplay = chalk.green(value);
        const statusIndicator = isDefault
          ? chalk.dim(' (default)')
          : chalk.blue(' (custom)');
        logger.info(`  ${key}: ${valueDisplay}${statusIndicator}`);
      });
      return;
    }

    // Handle 'get' command
    if (argv.command === 'get') {
      if (!argv.key) {
        logger.error('Key is required for get command');
        return;
      }

      if (argv.key in config) {
        logger.info(
          `${argv.key}: ${chalk.green(config[argv.key as keyof typeof config])}`,
        );
      } else {
        logger.error(`Configuration key '${argv.key}' not found`);
      }
      return;
    }

    // Handle 'set' command
    if (argv.command === 'set') {
      if (!argv.key) {
        logger.error('Key is required for set command');
        return;
      }

      if (argv.value === undefined) {
        logger.error('Value is required for set command');
        return;
      }

      // Parse the value based on current type or infer boolean/number
      let parsedValue: string | boolean | number = argv.value;

      // Check if config already exists to determine type
      if (argv.key in config) {
        if (typeof config[argv.key as keyof typeof config] === 'boolean') {
          parsedValue = argv.value.toLowerCase() === 'true';
        } else if (
          typeof config[argv.key as keyof typeof config] === 'number'
        ) {
          parsedValue = Number(argv.value);
        }
      } else {
        // If config doesn't exist yet, try to infer type
        if (
          argv.value.toLowerCase() === 'true' ||
          argv.value.toLowerCase() === 'false'
        ) {
          parsedValue = argv.value.toLowerCase() === 'true';
        } else if (!isNaN(Number(argv.value))) {
          parsedValue = Number(argv.value);
        }
      }

      const updatedConfig = updateConfig({ [argv.key]: parsedValue });
      logger.info(
        `Updated ${argv.key}: ${chalk.green(updatedConfig[argv.key as keyof typeof updatedConfig])}`,
      );
      return;
    }

    // Handle 'clear' command
    if (argv.command === 'clear') {
      if (!argv.key) {
        logger.error('Key is required for clear command');
        return;
      }

      const defaultConfig = getDefaultConfig();

      // Check if the key exists in the config
      if (!(argv.key in config)) {
        logger.error(`Configuration key '${argv.key}' not found`);
        return;
      }

      // Check if the key exists in the default config
      if (!(argv.key in defaultConfig)) {
        logger.error(
          `Configuration key '${argv.key}' does not have a default value`,
        );
        return;
      }

      // Get the current config, create a new object without the specified key
      const currentConfig = getConfig();
      const { [argv.key]: _, ...newConfig } = currentConfig as Record<
        string,
        any
      >;

      // Update the config file with the new object
      updateConfig(newConfig);

      // Get the default value that will now be used
      const defaultValue =
        defaultConfig[argv.key as keyof typeof defaultConfig];

      logger.info(
        `Cleared ${argv.key}, now using default value: ${chalk.green(defaultValue)}`,
      );
      return;
    }

    // If command not recognized
    logger.error(`Unknown config command: ${argv.command}`);
    logger.info('Available commands: get, set, list, clear');
  },
};
