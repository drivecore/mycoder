import { CommandModule } from 'yargs';
import { SharedOptions } from '../options.js';

export const command: CommandModule<object, SharedOptions> = {
  command: 'test-profile',
  describe: 'Test the profiling feature',
  handler: async () => {
    console.log('Profile test completed successfully');
    // Profiling report will be automatically displayed by the main function
    
    // Force a delay to simulate some processing
    await new Promise(resolve => setTimeout(resolve, 100));
  },
};