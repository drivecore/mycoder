import { mark } from './utils/performance.js';
mark('Before imports');

// Check if we should use citty or yargs
const useCitty = process.env.USE_CITTY === 'true';

// Function to handle async imports and run the appropriate implementation
async function run() {
  try {
    if (useCitty) {
      // Use citty implementation
      const { runCittyMain } = await import('./citty/index.js');
      await runCittyMain();
    } else {
      // Use original yargs implementation
      const { runYargsMain } = await import('./yargs-main.js');
      await runYargsMain();
    }
  } catch (error) {
    console.error('Failed to run CLI:', error);
    process.exit(1);
  }
}

// Run the CLI
run();

mark('After imports');
