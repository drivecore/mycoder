import { createRequire } from 'module';

import * as dotenv from 'dotenv';
import sourceMapSupport from 'source-map-support';
import yargs, { CommandModule } from 'yargs';
import { hideBin } from 'yargs/helpers';

import { command as defaultCommand } from './commands/$default.js';
import { command as configCommand } from './commands/config.js';
import { command as testSentryCommand } from './commands/test-sentry.js';
import { command as testProfileCommand } from './commands/test-profile.js';
import { command as toolsCommand } from './commands/tools.js';
import { sharedOptions } from './options.js';
import { initSentry, captureException } from './sentry/index.js';
import { enableProfiling, mark, reportTimings } from './utils/performance.js';

mark('After imports');

import type { PackageJson } from 'type-fest';

// Add global declaration for our patched toolAgent

mark('Before sourceMapSupport install');
sourceMapSupport.install();
mark('After sourceMapSupport install');

const main = async () => {
  // Parse argv early to check for profiling flag
  const parsedArgv = await yargs(hideBin(process.argv)).options(sharedOptions).parse();
  
  // Enable profiling if --profile flag is set
  enableProfiling(Boolean(parsedArgv.profile));
  
  mark('Main function start');
  
  dotenv.config();
  mark('After dotenv config');
  
  // Only initialize Sentry if needed
  if (process.env.NODE_ENV !== 'development' || process.env.ENABLE_SENTRY === 'true') {
    initSentry();
    mark('After Sentry init');
  }
  
  mark('Before package.json load');
  const require = createRequire(import.meta.url);
  const packageInfo = require('../package.json') as PackageJson;
  mark('After package.json load');
  
  // Set up yargs with the new CLI interface
  mark('Before yargs setup');
  await yargs(hideBin(process.argv))
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
  mark('After yargs setup');
  
  // Report timings if profiling is enabled
  await reportTimings();
};

await main().catch(async (error) => {
  console.error(error);
  // Report profiling data even if there's an error
  await reportTimings();
  // Capture the error with Sentry
  captureException(error);
  process.exit(1);
});
