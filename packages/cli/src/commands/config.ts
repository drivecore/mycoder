import chalk from 'chalk';
import { Logger } from 'mycoder-agent';

import { SharedOptions } from '../options.js';
import {
  getConfig,
  getDefaultConfig,
  updateConfig,
  getConfigAtLevel,
  clearConfigAtLevel,
  ConfigLevel,
} from '../settings/config.js';
import { nameToLogIndex } from '../utils/nameToLogIndex.js';

import type { CommandModule, ArgumentsCamelCase } from 'yargs';

export interface ConfigOptions extends SharedOptions {
  command: 'get' | 'set' | 'list' | 'clear';
  key?: string;
  value?: string;
  all?: boolean;
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
      .option('all', {
        describe: 'Clear all configuration settings (for clear command)',
        type: 'boolean',
        default: false,
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
      )
      .example(
        '$0 config set ANTHROPIC_API_KEY <your-key>',
        'Store your Anthropic API key in configuration',
      )
      .example(
        '$0 config clear --all',
        'Clear all configuration settings',
      ) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  },
  handler: async (argv: ArgumentsCamelCase<ConfigOptions>) => {
    const logger = new Logger({
      name: 'Config',
      logLevel: nameToLogIndex(argv.logLevel),
    });

    // Determine which config level to use based on flags
    const configLevel =
      argv.global || argv.g ? ConfigLevel.GLOBAL : ConfigLevel.PROJECT;
    const levelName = configLevel === ConfigLevel.GLOBAL ? 'global' : 'project';

    // Check if project level is writable when needed for operations that write to config
    if (
      configLevel === ConfigLevel.PROJECT &&
      (argv.command === 'set' ||
        (argv.command === 'clear' && (argv.key || argv.all)))
    ) {
      try {
        // Import directly to avoid circular dependency
        const { isProjectSettingsDirWritable } = await import(
          '../settings/settings.js'
        );
        if (!isProjectSettingsDirWritable()) {
          logger.error(
            chalk.red(
              'Cannot write to project configuration directory. Check permissions or use --global flag.',
            ),
          );
          logger.info(
            'You can use the --global (-g) flag to modify global configuration instead.',
          );
          return;
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error(
          chalk.red(
            `Error checking project directory permissions: ${errorMessage}`,
          ),
        );
        return;
      }
    }

    // Get merged config for display
    const config = getConfig();

    // Handle 'list' command
    if (argv.command === 'list') {
      // Import directly to avoid circular dependency
      const { getSettingsDir } = await import('../settings/settings.js');
      const { getProjectConfigFile } = await import('../settings/config.js');
      
      const globalConfigFile = path.join(getSettingsDir(), 'config.json');
      const projectConfigFile = getProjectConfigFile();
      
      logger.info('Current configuration:');
      logger.info(`Global config file: ${globalConfigFile}`);
      logger.info(`Project config file: ${projectConfigFile}`);
      logger.info('');
      
      const defaultConfig = getDefaultConfig();

      // Get all valid config keys
      const validKeys = Object.keys(defaultConfig);

      // Filter and sort config entries
      const configEntries = Object.entries(config)
        .filter(([key]) => validKeys.includes(key))
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

      // Display config entries with default indicators
      configEntries.forEach(([key, value]) => {
        const isDefault =
          JSON.stringify(value) ===
          JSON.stringify(defaultConfig[key as keyof typeof defaultConfig]);
        const valueDisplay = isDefault
          ? chalk.dim(`${value} (default)`)
          : chalk.green(value);
        logger.info(`  ${key}: ${valueDisplay}`);
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

      // Check if the key exists in default config
      const defaultConfig = getDefaultConfig();
      if (!(argv.key in defaultConfig)) {
        logger.warn(
          `Warning: '${argv.key}' is not a standard configuration key`,
        );
        logger.info(
          `Valid configuration keys: ${Object.keys(defaultConfig).join(', ')}`,
        );
        // Continue with the operation instead of returning
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

      try {
        // Update config at the specified level
        const updatedConfig = updateConfig(
          { [argv.key]: parsedValue },
          configLevel,
        );

        logger.info(
          `Updated ${argv.key}: ${chalk.green(updatedConfig[argv.key as keyof typeof updatedConfig])} at ${levelName} level`,
        );
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error(
          chalk.red(`Failed to update configuration: ${errorMessage}`),
        );
        if (configLevel === ConfigLevel.PROJECT) {
          logger.info(
            'You can use the --global (-g) flag to modify global configuration instead.',
          );
        }
      }
      return;
    }

    // Handle 'clear' command
    if (argv.command === 'clear') {
      // Check if --all flag is provided
      if (argv.all) {
        try {
          // Clear settings at the specified level
          clearConfigAtLevel(configLevel);
          logger.info(
            `All ${levelName} configuration settings have been cleared.`,
          );
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          logger.error(
            chalk.red(`Failed to clear configuration: ${errorMessage}`),
          );
          if (configLevel === ConfigLevel.PROJECT) {
            logger.info(
              'You can use the --global (-g) flag to modify global configuration instead.',
            );
          }
        }
        return;
      }

      if (!argv.key) {
        logger.error(
          'Key is required for clear command (or use --all to clear all settings)',
        );
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

      // Get the effective config after clearing
      const updatedConfig = getConfig();
      const newValue = updatedConfig[argv.key as keyof typeof updatedConfig];

      // Determine where the new value is coming from
      const isDefaultAfterClear =
        JSON.stringify(newValue) === JSON.stringify(defaultValue);
      const afterClearInGlobal =
        !isDefaultAfterClear &&
        argv.key in getConfigAtLevel(ConfigLevel.GLOBAL);
      const afterClearInProject =
        !isDefaultAfterClear &&
        !afterClearInGlobal &&
        argv.key in getConfigAtLevel(ConfigLevel.PROJECT);

      let sourceDisplay = '';
      if (isDefaultAfterClear) {
        sourceDisplay = '(default)';
      } else if (afterClearInProject) {
        sourceDisplay = '(from project config)';
      } else if (afterClearInGlobal) {
        sourceDisplay = '(from global config)';
      }

      logger.info(
        `Cleared ${argv.key} at ${levelName} level, now using: ${chalk.green(newValue)} ${sourceDisplay}`,
      );
      return;
    }

    // If command not recognized
    logger.error(`Unknown config command: ${argv.command}`);
    logger.info('Available commands: get, set, list, clear');
  },
};
