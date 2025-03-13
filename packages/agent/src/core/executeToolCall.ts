import { Logger } from '../utils/logger.js';

import { Tool, ToolCall, ToolContext } from './types.js';

const OUTPUT_LIMIT = 12 * 1024; // 10KB limit

/**
 * Executes a tool call and returns the formatted result
 */
export const executeToolCall = async (
  toolCall: ToolCall,
  tools: Tool[],
  context: ToolContext,
): Promise<string> => {
  const tool = tools.find((t) => t.name === toolCall.name);
  if (!tool) {
    return JSON.stringify({
      error: true,
      message: `No tool with the name '${toolCall.name}' exists.`,
    });
  }

  const logger = new Logger({
    name: `Tool:${toolCall.name}`,
    parent: context.logger,
    customPrefix: tool.logPrefix,
  });

  const toolContext: ToolContext = { ...context, logger };

  let parsedJson: any;
  try {
    parsedJson = JSON.parse(toolCall.content);
  } catch (err) {
    if (err instanceof Error) {
      logger.error(err.message);
      return JSON.stringify({
        error: true,
        message: 'Invalid JSON for tool call: ' + err.message,
        stack: err.stack,
      });
    } else {
      logger.error(err);
      return JSON.stringify({
        error: true,
        message: 'Invalid JSON for tool call: ' + err,
      });
    }
  }

  // validate JSON schema for input
  let validatedJson: any;
  try {
    validatedJson = tool.parameters.parse(parsedJson);
  } catch (err) {
    if (err instanceof Error) {
      logger.error(err.message);
      return JSON.stringify({
        error: true,
        message: 'Invalid format for tool call: ' + err.message,
        stack: err.stack,
      });
    } else {
      logger.error(err);
      return JSON.stringify({
        error: true,
        message: 'Invalid format for tool call: ' + err,
      });
    }
  }

  // for each parameter log it and its name
  if (tool.logParameters) {
    tool.logParameters(validatedJson, toolContext);
  } else {
    logger.info('Parameters:');
    Object.entries(validatedJson).forEach(([name, value]) => {
      logger.info(`  - ${name}: ${JSON.stringify(value).substring(0, 60)}`);
    });
  }

  let output: any;
  try {
    output = await tool.execute(validatedJson, toolContext);
  } catch (err) {
    if (err instanceof Error) {
      logger.error(err.message);
      return JSON.stringify({
        error: true,
        message: err.message,
        stack: err.stack,
      });
    } else {
      logger.error(err);
      return JSON.stringify({
        error: true,
        message: err,
      });
    }
  }

  // for each result log it and its name
  if (tool.logReturns) {
    tool.logReturns(output, toolContext);
  } else {
    logger.info('Results:');
    if (typeof output === 'string') {
      logger.info(`  - ${output}`);
    } else if (typeof output === 'object') {
      Object.entries(output).forEach(([name, value]) => {
        logger.info(`  - ${name}: ${JSON.stringify(value).substring(0, 60)}`);
      });
    }
  }

  const outputIsString = typeof output === 'string';
  if (outputIsString) {
    return output.length > OUTPUT_LIMIT
      ? `${output.slice(0, OUTPUT_LIMIT)}...(truncated)`
      : output;
  } else {
    return JSON.stringify(output, null, 2);
  }
};
