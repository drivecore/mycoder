import { runMain } from 'citty';
import * as dotenv from 'dotenv';
import sourceMapSupport from 'source-map-support';

import { initSentry, captureException } from '../sentry/index.js';
import { cleanupResources, setupForceExit } from '../utils/cleanup.js';
import { mark, reportTimings } from '../utils/performance.js';

import { createMainCommand } from './cli.js';

// Install source map support for better error stack traces
sourceMapSupport.install();

/**
 * Main entry point for the CLI when using citty
 */
export async function main() {
  mark('Main function start');

  // Load environment variables from .env file
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

  // Create the main command with all subcommands
  const mainCommand = await createMainCommand();
  mark('After command setup');

  // Run the main command
  await runMain(mainCommand);
}

// Run the main function with error handling
export async function runCittyMain() {
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
