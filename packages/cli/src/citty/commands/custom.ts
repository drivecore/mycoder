import { defineCommand, CommandDef } from 'citty';
import { loadConfig } from '../../settings/config.js';
import { executePrompt } from '../utils/execute-prompt.js';
import { sharedArgs } from '../args.js';

/**
 * Gets custom commands defined in the config file
 * @returns Record of command name to command definition
 */
export async function getCustomCommands(): Promise<Record<string, CommandDef>> {
  const config = await loadConfig();
  
  if (!config.commands) {
    return {};
  }
  
  const commands: Record<string, CommandDef> = {};
  
  for (const [name, commandConfig] of Object.entries(config.commands)) {
    const commandArgs: Record<string, any> = {
      ...sharedArgs,
    };
    
    // Convert args to citty format
    (commandConfig.args || []).forEach((arg) => {
      commandArgs[arg.name] = {
        type: 'string',
        description: arg.description,
        default: arg.default,
        required: arg.required,
      };
    });
    
    commands[name] = defineCommand({
      meta: {
        name,
        description: commandConfig.description || `Custom command: ${name}`,
      },
      args: commandArgs,
      async run({ args }) {
        // Load config
        const config = await loadConfig();
        
        // Extract args from command line
        const commandArgs = (commandConfig.args || []).reduce(
          (acc, arg) => {
            acc[arg.name] = args[arg.name] as string || '';
            return acc;
          },
          {} as Record<string, string>,
        );
        
        // Execute the command
        const prompt = await commandConfig.execute(commandArgs);
        
        // Execute the prompt using the default command handler
        await executePrompt(prompt, config);
      },
    });
  }
  
  return commands;
}