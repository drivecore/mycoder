import { createInterface } from 'readline/promises';

import chalk from 'chalk';
import { Logger } from 'mycoder-agent';

import { SharedOptions } from '../options.js';
import {
  getConfig,
  getDefaultConfig,
  updateConfig,
  clearAllConfig,
  getConfigAtLevel,
  clearConfigAtLevel,
  clearConfigKey,
  ConfigLevel,
} from '../settings/config.js';
import { nameToLogIndex } from '../utils/nameToLogIndex.js';

/**
 * Prompts the user for confirmation with a yes/no question
 * @param question The question to ask the user
 * @returns True if the user confirmed, false otherwise
 */
async function confirm(question: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = await rl.question(`${question} (y/N): `);
    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  } finally {
    rl.close();
  }
}

import type { CommandModule, ArgumentsCamelCase } from 'yargs';

export interface ConfigOptions extends SharedOptions {
  command: 'get' | 'set' | 'list' | 'clear';
  key?: string;
  value?: string;
  all?: boolean;
  global?: boolean;
  g?: boolean; // Alias for global
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
      .option('global', {
        alias: 'g',
        describe: 'Use global configuration instead of project-level',
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
        'Clear all project-level configuration settings',
      )
      .example(
        '$0 config set githubMode true --global',
        'Enable GitHub mode in global configuration',
      )
      .example(
        '$0 config set model claude-3-haiku-20240307 -g',
        'Set model in global configuration using short flag',
      )
      .example(
        '$0 config list --global',
        'List all global configuration settings',
      )
      .example(
        '$0 config clear --all --global',
        'Clear all global configuration settings',
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
    const mergedConfig = getConfig();

    // Get level-specific configs for reference
    const defaultConfig = getConfigAtLevel(ConfigLevel.DEFAULT);
    const globalConfig = getConfigAtLevel(ConfigLevel.GLOBAL);
    const projectConfig = getConfigAtLevel(ConfigLevel.PROJECT);

    // Handle 'list' command
    if (argv.command === 'list') {
      logger.info('Current configuration:');

      // Get all valid config keys
      const validKeys = Object.keys(defaultConfig);

      // Filter and sort config entries
      const configEntries = Object.entries(mergedConfig)
        .filter(([key]) => validKeys.includes(key))
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

      // Display config entries with source indicators
      configEntries.forEach(([key, value]) => {
        const inProject = key in projectConfig;
        const inGlobal = key in globalConfig;
        const isDefault = !inProject && !inGlobal;

        let valueDisplay = '';
        let sourceDisplay = '';

        if (isDefault) {
          valueDisplay = chalk.dim(`${value} (default)`);
        } else if (inProject) {
          valueDisplay = chalk.green(`${value}`);
          sourceDisplay = chalk.blue(' [project]');
        } else if (inGlobal) {
          valueDisplay = chalk.yellow(`${value}`);
          sourceDisplay = chalk.magenta(' [global]');
        }

        logger.info(`  ${key}: ${valueDisplay}${sourceDisplay}`);
      });

      logger.info('');
      logger.info('Configuration levels (in order of precedence):');
      logger.info('  CLI options (highest)');
      logger.info(
        '  Project config (.mycoder/config.json in current directory)',
      );
      logger.info('  Global config (~/.mycoder/config.json)');
      logger.info('  Default values (lowest)');
      return;
    }

    // Handle 'get' command
    if (argv.command === 'get') {
      if (!argv.key) {
        logger.error('Key is required for get command');
        return;
      }

      // Check if the key exists in the merged config
      if (argv.key in mergedConfig) {
        const value = mergedConfig[argv.key as keyof typeof mergedConfig];

        // Determine the source of this value
        const inProject = argv.key in projectConfig;
        const inGlobal = argv.key in globalConfig;
        const isDefault = !inProject && !inGlobal;

        let valueDisplay = '';
        let sourceDisplay = '';

        if (isDefault) {
          valueDisplay = chalk.dim(`${value} (default)`);
        } else if (inProject) {
          valueDisplay = chalk.green(`${value}`);
          sourceDisplay = chalk.blue(' [project]');
        } else if (inGlobal) {
          valueDisplay = chalk.yellow(`${value}`);
          sourceDisplay = chalk.magenta(' [global]');
        }

        logger.info(`${argv.key}: ${valueDisplay}${sourceDisplay}`);
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

      // Check if this is an API key and add a warning
      if (argv.key.includes('API_KEY')) {
        logger.warn(
          chalk.yellow(
            'Warning: Storing API keys in configuration is less secure than using environment variables.',
          ),
        );
        logger.warn(
          chalk.yellow(
            'Your API key will be stored in plaintext in the configuration file.',
          ),
        );

        // Ask for confirmation
        const isConfirmed = await confirm(
          'Do you want to continue storing your API key in the configuration?',
        );

        if (!isConfirmed) {
          logger.info('Operation cancelled.');
          return;
        }
      }

      // Parse the value based on current type or infer boolean/number
      let parsedValue: string | boolean | number = argv.value;

      // Check if config already exists to determine type
      if (argv.key in mergedConfig) {
        if (
          typeof mergedConfig[argv.key as keyof typeof mergedConfig] ===
          'boolean'
        ) {
          parsedValue = argv.value.toLowerCase() === 'true';
        } else if (
          typeof mergedConfig[argv.key as keyof typeof mergedConfig] ===
          'number'
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
        const confirmMessage = `Are you sure you want to clear all ${levelName} configuration settings? This action cannot be undone.`;

        if (configLevel === ConfigLevel.GLOBAL && !argv.global && !argv.g) {
          // If no level was explicitly specified and we're using the default (project),
          // ask if they want to clear all levels
          const clearAllLevels = await confirm(
            'Do you want to clear both project and global configuration? (No will clear only project config)',
          );

          if (clearAllLevels) {
            // Confirm before clearing all levels
            const isConfirmed = await confirm(
              'Are you sure you want to clear ALL configuration settings (both project and global)? This action cannot be undone.',
            );

            if (!isConfirmed) {
              logger.info('Operation cancelled.');
              return;
            }

            // Clear all settings at all levels
            clearAllConfig();
            logger.info(
              'All configuration settings (both project and global) have been cleared. Default values will be used.',
            );
            return;
          }
        }

        // Confirm before clearing the specified level
        const isConfirmed = await confirm(confirmMessage);

        if (!isConfirmed) {
          logger.info('Operation cancelled.');
          return;
        }

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

      // Check if the key exists at the specified level
      const levelConfig = getConfigAtLevel(configLevel);
      if (!(argv.key in levelConfig)) {
        logger.error(
          `Configuration key '${argv.key}' not found at ${levelName} level`,
        );
        return;
      }

      // Check if the key exists in the default config
      if (!(argv.key in defaultConfig)) {
        logger.error(
          `Configuration key '${argv.key}' does not have a default value`,
        );
        return;
      }

      try {
        // Clear the key at the specified level
        clearConfigKey(argv.key, configLevel);

        // Get the value that will now be used
        const mergedAfterClear = getConfig();
        const newValue =
          mergedAfterClear[argv.key as keyof typeof mergedAfterClear];

        // Determine the source of the new value
        const afterClearInProject =
          argv.key in getConfigAtLevel(ConfigLevel.PROJECT);
        const afterClearInGlobal =
          argv.key in getConfigAtLevel(ConfigLevel.GLOBAL);
        const isDefaultAfterClear = !afterClearInProject && !afterClearInGlobal;

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
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error(
          chalk.red(`Failed to clear configuration key: ${errorMessage}`),
        );
        if (configLevel === ConfigLevel.PROJECT) {
          logger.info(
            'You can use the --global (-g) flag to modify global configuration instead.',
          );
        }
      }
      return;
    }

    // If command not recognized
    logger.error(`Unknown config command: ${argv.command}`);
    logger.info('Available commands: get, set, list, clear');
  },
};
