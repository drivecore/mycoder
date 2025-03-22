import { getTools } from 'mycoder-agent';

import type { CommandModule } from 'yargs';
import type { JsonSchema7Type } from 'zod-to-json-schema';

interface ToolsArgs {
  [key: string]: unknown;
}

function formatSchema(schema: {
  properties?: Record<string, JsonSchema7Type>;
  required?: string[];
}) {
  let output = '';

  if (schema.properties) {
    for (const [paramName, param] of Object.entries(schema.properties)) {
      const required = schema.required?.includes(paramName)
        ? ''
        : ' (optional)';
      const description = (param as any).description || '';
      output += `${paramName}${required}: ${description}\n`;

      if ((param as any).type) {
        output += `    Type: ${(param as any).type}\n`;
      }
      if ((param as any).maxLength) {
        output += `    Max Length: ${(param as any).maxLength}\n`;
      }
      if ((param as any).additionalProperties) {
        output += `    Additional Properties: ${JSON.stringify((param as any).additionalProperties)}\n`;
      }
    }
  }

  return output;
}

export const command: CommandModule<object, ToolsArgs> = {
  command: 'tools',
  describe: 'List all available tools and their capabilities',
  handler: () => {
    try {
      const tools = getTools({ subAgentMode: 'disabled' });

      console.log('Available Tools:\n');

      for (const tool of tools) {
        // Tool name and description
        console.log(`${tool.name}`);
        console.log('-'.repeat(tool.name.length));
        console.log(`Description: ${tool.description}\n`);

        // Parameters section
        console.log('Parameters:');
        // Use parametersJsonSchema if available, otherwise convert from ZodSchema
        const parametersSchema =
          (tool as any).parametersJsonSchema || tool.parameters;
        console.log(
          formatSchema(
            parametersSchema as {
              properties?: Record<string, JsonSchema7Type>;
              required?: string[];
            },
          ),
        );

        // Returns section
        console.log('Returns:');
        if (tool.returns) {
          // Use returnsJsonSchema if available, otherwise convert from ZodSchema
          const returnsSchema = (tool as any).returnsJsonSchema || tool.returns;
          console.log(
            formatSchema(
              returnsSchema as {
                properties?: Record<string, JsonSchema7Type>;
                required?: string[];
              },
            ),
          );
        } else {
          console.log('    Type: any');
          console.log('    Description: Tool execution result or error\n');
        }

        console.log(); // Add spacing between tools
      }
    } catch (error) {
      console.error('Error listing tools:', error);
      process.exit(1);
    }
  },
};
