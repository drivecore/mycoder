import * as fs from 'fs/promises';

import { userPrompt } from 'mycoder-agent';

import { getContainer } from '../di/container.js';
import { SharedOptions } from '../options.js';
import { CommandService } from '../services/command.service.js';
import { LoggerService } from '../services/logger.service.js';
import { ServiceFactory } from '../services/service.factory.js';

import type { CommandModule, Argv } from 'yargs';

interface DefaultArgs extends SharedOptions {
  prompt?: string;
}

/**
 * Executes a prompt with the given configuration
 * This function is exported to be reused by custom commands
 */
export async function executePrompt(
  prompt: string,
  _argv: DefaultArgs, // Prefix with underscore to indicate it's intentionally unused
): Promise<void> {
  const container = getContainer();

  // Get the command service from the container
  const commandService = container.get<CommandService>('commandService');

  // Execute the command
  await commandService.execute(prompt);
}

export const command: CommandModule<SharedOptions, DefaultArgs> = {
  command: '* [prompt]',
  describe: 'Execute a prompt or start interactive mode',
  builder: (yargs: Argv<object>): Argv<DefaultArgs> => {
    return yargs.positional('prompt', {
      type: 'string',
      description: 'The prompt to execute',
    }) as Argv<DefaultArgs>;
  },
  handler: async (argv) => {
    // Initialize services
    const serviceFactory = new ServiceFactory();
    await serviceFactory.initializeServices(argv);

    const container = getContainer();
    const loggerService = container.get<LoggerService>('loggerService');
    const logger = loggerService.getDefaultLogger();

    // Determine the prompt source
    let prompt: string | undefined;

    // If promptFile is specified, read from file
    if (argv.file) {
      prompt = await fs.readFile(argv.file, 'utf-8');
    }

    // If interactive mode
    if (argv.interactive) {
      prompt = await userPrompt(
        "Type your request below or 'help' for usage information. Use Ctrl+C to exit.",
      );
    } else if (!prompt) {
      // Use command line prompt if provided
      prompt = argv.prompt;
    }

    if (!prompt) {
      logger.error(
        'No prompt provided. Either specify a prompt, use --promptFile, or run in --interactive mode.',
      );
      throw new Error('No prompt provided');
    }

    // Execute the prompt
    await executePrompt(prompt, argv);
  },
};
