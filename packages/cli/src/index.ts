import { createRequire } from 'module';

import * as dotenv from 'dotenv';
import sourceMapSupport from 'source-map-support';
import yargs, { CommandModule } from 'yargs';
import { hideBin } from 'yargs/helpers';

import { command as defaultCommand } from './commands/$default.js';
import { command as configCommand } from './commands/config.js';
import { command as testProfileCommand } from './commands/test-profile.js';
import { command as testSentryCommand } from './commands/test-sentry.js';
import { command as toolsCommand } from './commands/tools.js';
import { sharedOptions } from './options.js';
import { initSentry, captureException } from './sentry/index.js';
import { getConfig } from './settings/config.js';
import { cleanupResources, setupForceExit } from './utils/cleanup.js';
import { enableProfiling, mark, reportTimings } from './utils/performance.js';

mark('After imports');

import type { PackageJson } from 'type-fest';

// Add global declaration for our patched toolAgent

mark('Before sourceMapSupport install');
sourceMapSupport.install();
mark('After sourceMapSupport install');

const main = async () => {
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
      configCommand,
    ] as CommandModule[])
    .strict()
    .showHelpOnFail(true)
    .help().argv;

  // Get config to check for profile setting
  const config = getConfig();

  // Enable profiling if --profile flag is set or if enabled in config
  enableProfiling(Boolean(argv.profile) || Boolean(config.profile));
  mark('After yargs setup');
};

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
