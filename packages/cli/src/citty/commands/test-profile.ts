import { defineCommand } from 'citty';

import {
  enableProfiling,
  mark,
  reportTimings,
} from '../../utils/performance.js';
import { sharedArgs } from '../args.js';

export const testProfileCommand = defineCommand({
  meta: {
    name: 'test-profile',
    description: 'Test performance profiling',
  },
  args: {
    ...sharedArgs,
  },
  async run() {
    console.log('Testing performance profiling...');

    // Enable profiling
    enableProfiling(true);

    // Create some test marks
    mark('Start test');

    // Simulate some work
    await new Promise((resolve) => setTimeout(resolve, 100));
    mark('After 100ms');

    await new Promise((resolve) => setTimeout(resolve, 200));
    mark('After 300ms');

    await new Promise((resolve) => setTimeout(resolve, 300));
    mark('After 600ms');

    // Report timings
    await reportTimings();

    console.log('Performance profiling test complete.');
  },
});
