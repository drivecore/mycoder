import { exec, ExecException } from 'child_process';
import { promisify } from 'util';

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { Tool } from '../../core/types.js';
import { errorToString } from '../../utils/errorToString.js';

const execAsync = promisify(exec);

const parameterSchema = z.object({
  command: z
    .string()
    .describe('The shell command to execute in MacOS bash format'),
  description: z
    .string()
    .describe('The reason this shell command is being run (max 80 chars)'),
  timeout: z
    .number()
    .optional()
    .describe('Timeout in milliseconds (optional, default 30000)'),
  stdinContent: z
    .string()
    .optional()
    .describe(
      'Content to pipe into the shell command as stdin (useful for passing multiline content to commands)',
    ),
});

const returnSchema = z
  .object({
    stdout: z.string(),
    stderr: z.string(),
    command: z.string(),
    code: z.number(),
    error: z.string().optional(),
  })
  .describe(
    'Command execution results including stdout, stderr, and exit code',
  );

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

interface ExtendedExecException extends ExecException {
  stdout?: string;
  stderr?: string;
}

export const shellExecuteTool: Tool<Parameters, ReturnType> = {
  name: 'shellExecute',
  logPrefix: '💻',
  description:
    'Executes a bash shell command and returns its output, can do amazing things if you are a shell scripting wizard',
  parameters: parameterSchema,
  returns: returnSchema,
  parametersJsonSchema: zodToJsonSchema(parameterSchema),
  returnsJsonSchema: zodToJsonSchema(returnSchema),

  execute: async (
    { command, timeout = 30000, stdinContent },
    { logger },
  ): Promise<ReturnType> => {
    logger.debug(
      `Executing shell command with ${timeout}ms timeout: ${command}`,
    );
    if (stdinContent) {
      logger.debug(`With stdin content of length: ${stdinContent.length}`);
    }

    try {
      let stdout, stderr;

      // If stdinContent is provided, use platform-specific approach to pipe content
      if (stdinContent && stdinContent.length > 0) {
        // Replace literal \n with actual newlines and \t with actual tabs
        stdinContent = stdinContent.replace(/\\n/g, '\n').replace(/\\t/g, '\t');

        const isWindows = process.platform === 'win32';
        const encodedContent = Buffer.from(stdinContent).toString('base64');

        if (isWindows) {
          // Windows approach using PowerShell
          const powershellCommand = `[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${encodedContent}')) | ${command}`;
          ({ stdout, stderr } = await execAsync(
            `powershell -Command "${powershellCommand}"`,
            {
              timeout,
              maxBuffer: 10 * 1024 * 1024, // 10MB buffer
            },
          ));
        } else {
          // POSIX approach (Linux/macOS)
          const bashCommand = `echo "${encodedContent}" | base64 -d | ${command}`;
          ({ stdout, stderr } = await execAsync(bashCommand, {
            timeout,
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer
          }));
        }
      } else {
        // No stdin content, use normal approach
        ({ stdout, stderr } = await execAsync(command, {
          timeout,
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        }));
      }

      logger.debug('Command executed successfully');
      logger.debug(`stdout: ${stdout.trim()}`);
      if (stderr.trim()) {
        logger.debug(`stderr: ${stderr.trim()}`);
      }

      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        code: 0,
        error: '',
        command,
      };
    } catch (error) {
      if (error instanceof Error) {
        const execError = error as ExtendedExecException;
        const isTimeout = error.message.includes('timeout');

        logger.debug(`Command execution failed: ${error.message}`);

        return {
          error: isTimeout
            ? 'Command execution timed out after ' + timeout + 'ms'
            : error.message,
          stdout: execError.stdout?.trim() ?? '',
          stderr: execError.stderr?.trim() ?? '',
          code: execError.code ?? -1,
          command,
        };
      }
      logger.error(
        `Unknown error occurred during command execution: ${errorToString(error)}`,
      );
      return {
        error: `Unknown error occurred: ${errorToString(error)}`,
        stdout: '',
        stderr: '',
        code: -1,
        command,
      };
    }
  },
  logParameters: (input, { logger }) => {
    logger.log(
      `Running "${input.command}", ${input.description}${input.stdinContent ? ' (with stdin content)' : ''}`,
    );
  },
  logReturns: () => {},
};
