import { createRequire } from 'module';
import { join } from 'path';
import { fileURLToPath } from 'url';

import * as dotenv from 'dotenv';
import sourceMapSupport from 'source-map-support';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { fileCommands } from 'yargs-file-commands';

// Initialize Sentry as early as possible
import { sharedOptions } from './options.js';
import { initSentry, captureException } from './sentry/index.js';
initSentry();

import type { PackageJson } from 'type-fest';

// Add global declaration for our patched toolAgent

sourceMapSupport.install();

const main = async () => {
  dotenv.config();

  const require = createRequire(import.meta.url);
  const packageInfo = require('../package.json') as PackageJson;

  // Get the directory where commands are located
  const __filename = fileURLToPath(import.meta.url);
  const commandsDir = join(__filename, '..', 'commands');

  // Set up yargs with the new CLI interface
  await yargs(hideBin(process.argv))
    .scriptName(packageInfo.name!)
    .version(packageInfo.version!)
    .options(sharedOptions)
    .alias('h', 'help')
    .alias('V', 'version')
    .command(
      await fileCommands({
        commandDirs: [commandsDir],
        logLevel: 'info',
      }),
    )
    .strict()
    .showHelpOnFail(true)
    .help().argv;
};

await main().catch((error) => {
  console.error(error);
  // Capture the error with Sentry
  captureException(error);
  process.exit(1);
});
