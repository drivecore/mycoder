import { defineCommand } from 'citty';

import { captureException, initSentry } from '../../sentry/index.js';
import { sharedArgs } from '../args.js';

export const testSentryCommand = defineCommand({
  meta: {
    name: 'test-sentry',
    description: 'Test Sentry error reporting',
  },
  args: {
    ...sharedArgs,
  },
  run() {
    console.log('Testing Sentry error reporting...');

    // Initialize Sentry if not already initialized
    initSentry();

    // Create a test error
    const testError = new Error('This is a test error from the CLI');

    // Capture the error with Sentry
    captureException(testError);

    console.log(
      'Test error sent to Sentry. Please check your Sentry dashboard.',
    );
  },
});
