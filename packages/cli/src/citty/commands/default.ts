import * as fs from 'fs/promises';

import { defineCommand } from 'citty';
import { userPrompt, Logger, subAgentTool } from 'mycoder-agent';

import { getConfigFromArgv, loadConfig } from '../../settings/config.js';
import { nameToLogIndex } from '../../utils/nameToLogIndex.js';
import { sharedArgs, DefaultArgs } from '../args.js';
import { executePrompt } from '../utils/execute-prompt.js';

export const defaultCommand = defineCommand({
  meta: {
    name: 'default',
    description: 'Execute a prompt or start interactive mode',
  },
  args: {
    ...sharedArgs,
    prompt: {
      type: 'positional',
      description: 'The prompt to execute',
    },
  },
  async run({ args }) {
    // Get configuration for model provider and name
    const typedArgs = args as unknown as DefaultArgs;
    const config = await loadConfig(getConfigFromArgv({
      ...typedArgs,
      logLevel: typedArgs.logLevel || 'info'
    }));

    let prompt: string | undefined;

    // If file is specified, read from file
    if (typedArgs.file) {
      prompt = await fs.readFile(typedArgs.file, 'utf-8');
    }

    // If interactive mode
    if (typedArgs.interactive) {
      prompt = await userPrompt(
        "Type your request below or 'help' for usage information. Use Ctrl+C to exit.",
      );
    } else if (!prompt) {
      // Use command line prompt if provided
      prompt = typedArgs.prompt || '';
    }

    if (!prompt) {
      const logger = new Logger({
        name: 'Default',
        logLevel: nameToLogIndex(config.logLevel),
        customPrefix: subAgentTool.logPrefix,
      });

      logger.error(
        'No prompt provided. Either specify a prompt, use --file, or run in --interactive mode.',
      );
      throw new Error('No prompt provided');
    }

    // Execute the prompt
    await executePrompt(prompt, config);
  },
});