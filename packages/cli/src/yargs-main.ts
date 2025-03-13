import { createRequire } from 'module';

import * as dotenv from 'dotenv';
import sourceMapSupport from 'source-map-support';
import yargs, { ArgumentsCamelCase, CommandModule } from 'yargs';
import { hideBin } from 'yargs/helpers';

import { command as defaultCommand } from './commands/$default.js';
import { getCustomCommands } from './commands/custom.js';
import { command as testProfileCommand } from './commands/test-profile.js';
import { command as testSentryCommand } from './commands/test-sentry.js';
import { command as toolsCommand } from './commands/tools.js';
import { SharedOptions, sharedOptions } from './options.js';
import { initSentry, captureException } from './sentry/index.js';
import { getConfigFromArgv, loadConfig } from './settings/config.js';
import { cleanupResources, setupForceExit } from './utils/cleanup.js';
import { enableProfiling, mark, reportTimings } from './utils/performance.js';

import type { PackageJson } from 'type-fest';

// Add global declaration for our patched toolAgent

mark('Before sourceMapSupport install');
sourceMapSupport.install();
mark('After sourceMapSupport install');

export const main = async () => {
  mark('Main function start');

  dotenv.config();
  mark('After dotenv config');

  // Only initialize Sentry if needed
  if (
    process.env.NODE_ENV !== 'development' ||
    process.env.ENABLE_SENTRY === 'true'
  ) {
    initSentry();
    mark('After Sentry init');
  }

  mark('Before package.json load');
  const require = createRequire(import.meta.url);
  const packageInfo = require('../package.json') as PackageJson;
  mark('After package.json load');

  // Set up yargs with the new CLI interface
  mark('Before yargs setup');

  // Load custom commands from config
  const customCommands = await getCustomCommands();

  const argv = await yargs(hideBin(process.argv))
    .scriptName(packageInfo.name!)
    .version(packageInfo.version!)
    .options(sharedOptions)
    .alias('h', 'help')
    .alias('V', 'version')
    .command([
      defaultCommand,
      testSentryCommand,
      testProfileCommand,
      toolsCommand,
      ...customCommands, // Add custom commands
    ] as CommandModule[])
    .strict()
    .showHelpOnFail(true)
    .help().argv;

  // Get config to check for profile setting
  const config = await loadConfig(
    getConfigFromArgv(argv as ArgumentsCamelCase<SharedOptions>),
  );

  // Enable profiling if --profile flag is set or if enabled in config
  enableProfiling(config.profile);
  mark('After yargs setup');
};

export async function runYargsMain() {
  await main()
    .catch(async (error) => {
      console.error(error);
      // Capture the error with Sentry
      captureException(error);
      process.exit(1);
    })
    .finally(async () => {
      // Report timings if profiling is enabled
      await reportTimings();

      // Clean up all resources before exit
      await cleanupResources();

      // Setup a force exit as a failsafe
      // This ensures the process will exit even if there are lingering handles
      setupForceExit(5000);
    });
}
