import { CommandModule } from 'yargs';

import { loadConfig } from '../settings/config.js';

import { executePrompt } from './$default.js';

/**
 * Gets custom commands defined in the config file
 * @returns Array of command modules for custom commands
 */
export async function getCustomCommands(): Promise<CommandModule[]> {
  const config = await loadConfig();

  if (!config.commands) {
    return [];
  }

  return Object.entries(config.commands).map(([name, commandConfig]) => {
    return {
      command: `${name} ${(commandConfig.args || [])
        .map((arg) => (arg.required ? `<${arg.name}>` : `[${arg.name}]`))
        .join(' ')}`,
      describe: commandConfig.description || `Custom command: ${name}`,
      builder: (yargs) => {
        // Register args as options
        (commandConfig.args || []).forEach((arg) => {
          yargs.option(arg.name, {
            type: 'string',
            description: arg.description,
            default: arg.default,
            demandOption: arg.required,
          });
        });
        return yargs;
      },
      handler: async (argv) => {
        // Extract args
        const args = (commandConfig.args || []).reduce(
          (acc, arg) => {
            acc[arg.name] = argv[arg.name] as string;
            return acc;
          },
          {} as Record<string, string>,
        );

        // Load config
        const config = await loadConfig();

        // Execute the command
        const prompt = await commandConfig.execute(args);

        // Execute the prompt using the default command handler
        await executePrompt(prompt, config);
      },
    };
  });
}
