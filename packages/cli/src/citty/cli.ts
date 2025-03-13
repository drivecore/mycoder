import { createRequire } from 'module';

import { defineCommand } from 'citty';

import { sharedArgs } from './args.js';
import { getCustomCommands } from './commands/custom.js';
import { defaultCommand } from './commands/default.js';
import { testProfileCommand } from './commands/test-profile.js';
import { testSentryCommand } from './commands/test-sentry.js';
import { toolsCommand } from './commands/tools.js';

import type { PackageJson } from 'type-fest';

const require = createRequire(import.meta.url);
const packageInfo = require('../../package.json') as PackageJson;

/**
 * Create the main CLI command with all subcommands
 */
export async function createMainCommand() {
  // Load custom commands from config
  const customCommands = await getCustomCommands();

  // Create the main command
  const main = defineCommand({
    meta: {
      name: packageInfo.name!,
      version: packageInfo.version!,
      description: packageInfo.description!,
    },
    args: sharedArgs,
    subCommands: {
      'test-sentry': testSentryCommand,
      'test-profile': testProfileCommand,
      tools: toolsCommand,
      ...customCommands,
    },
    // Default command implementation
    run: defaultCommand.run,
  });

  return main;
}
