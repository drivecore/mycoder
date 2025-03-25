import { spawn } from 'child_process';

import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { Tool } from '../../core/types.js';
import { errorToString } from '../../utils/errorToString.js';

import { ShellStatus } from './ShellTracker.js';

import type { ProcessState } from './ShellTracker.js';

const parameterSchema = z.object({
  command: z.string().describe('The shell command to execute'),
  description: z
    .string()
    .describe('The reason this shell command is being run (max 80 chars)'),
  timeout: z
    .number()
    .optional()
    .describe(
      'Timeout in ms before switching to async mode (default: 10s, which usually is sufficient)',
    ),
  showStdIn: z
    .boolean()
    .optional()
    .describe(
      'Whether to show the command input to the user, or keep the output clean (default: false)',
    ),
  showStdout: z
    .boolean()
    .optional()
    .describe(
      'Whether to show command output to the user, or keep the output clean (default: false)',
    ),
  stdinContent: z
    .string()
    .optional()
    .describe(
      'Content to pipe into the shell command as stdin (useful for passing multiline content to commands)',
    ),
});

const returnSchema = z.union([
  z
    .object({
      mode: z.literal('sync'),
      stdout: z.string(),
      stderr: z.string(),
      exitCode: z.number(),
      error: z.string().optional(),
    })
    .describe(
      'Synchronous execution results when command completes within timeout',
    ),
  z
    .object({
      mode: z.literal('async'),
      shellId: z.string(),
      stdout: z.string(),
      stderr: z.string(),
      error: z.string().optional(),
    })
    .describe('Asynchronous execution results when command exceeds timeout'),
]);

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

const DEFAULT_TIMEOUT = 1000 * 10;

export const shellStartTool: Tool<Parameters, ReturnType> = {
  name: 'shellStart',
  description:
    'Starts a shell command with fast sync mode (default 100ms timeout) that falls back to async mode for longer-running commands',
  logPrefix: '💻',
  parameters: parameterSchema,
  returns: returnSchema,
  parametersJsonSchema: zodToJsonSchema(parameterSchema),
  returnsJsonSchema: zodToJsonSchema(returnSchema),

  execute: async (
    {
      command,
      timeout = DEFAULT_TIMEOUT,
      showStdIn = false,
      showStdout = false,
      stdinContent,
    },
    { logger, workingDirectory, shellTracker },
  ): Promise<ReturnType> => {
    if (showStdIn) {
      logger.log(`Command input: ${command}`);
      if (stdinContent) {
        logger.log(`Stdin content: ${stdinContent}`);
      }
    }
    logger.debug(`Starting shell command: ${command}`);
    if (stdinContent) {
      logger.debug(`With stdin content of length: ${stdinContent.length}`);
    }

    return new Promise((resolve) => {
      try {
        // Register this shell process with the shell tracker and get the shellId
        const shellId = shellTracker.registerShell(command);

        let hasResolved = false;

        // Determine if we need to use a special approach for stdin content
        const isWindows =
          typeof process !== 'undefined' && process.platform === 'win32';
        let childProcess;

        if (stdinContent && stdinContent.length > 0) {
          // Replace literal \n with actual newlines and \t with actual tabs
          stdinContent = stdinContent
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t');

          if (isWindows) {
            // Windows approach using PowerShell
            const encodedContent = Buffer.from(stdinContent).toString('base64');
            childProcess = spawn(
              'powershell',
              [
                '-Command',
                `[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${encodedContent}')) | ${command}`,
              ],
              {
                cwd: workingDirectory,
              },
            );
          } else {
            // POSIX approach (Linux/macOS)
            const encodedContent = Buffer.from(stdinContent).toString('base64');
            childProcess = spawn(
              'bash',
              ['-c', `echo "${encodedContent}" | base64 -d | ${command}`],
              {
                cwd: workingDirectory,
              },
            );
          }
        } else {
          // No stdin content, use normal approach
          childProcess = spawn(command, [], {
            shell: true,
            cwd: workingDirectory,
          });
        }

        const processState: ProcessState = {
          command,
          process: childProcess,
          stdout: [],
          stderr: [],
          state: { completed: false, signaled: false, exitCode: null },
          showStdIn,
          showStdout,
        };

        // Initialize process state
        shellTracker.processStates.set(shellId, processState);

        // Handle process events
        if (childProcess.stdout)
          childProcess.stdout.on('data', (data) => {
            const output = data.toString();
            processState.stdout.push(output);
            logger[processState.showStdout ? 'log' : 'debug'](
              `[${shellId}] stdout: ${output.trim()}`,
            );
          });

        if (childProcess.stderr)
          childProcess.stderr.on('data', (data) => {
            const output = data.toString();
            processState.stderr.push(output);
            logger[processState.showStdout ? 'log' : 'debug'](
              `[${shellId}] stderr: ${output.trim()}`,
            );
          });

        childProcess.on('error', (error) => {
          logger.error(`[${shellId}] Process error: ${error.message}`);
          processState.state.completed = true;

          // Update shell tracker with error status
          shellTracker.updateShellStatus(shellId, ShellStatus.ERROR, {
            error: error.message,
          });

          if (!hasResolved) {
            hasResolved = true;
            resolve({
              mode: 'async',
              shellId,
              stdout: processState.stdout.join('').trim(),
              stderr: processState.stderr.join('').trim(),
              error: error.message,
            });
          }
        });

        childProcess.on('exit', (code, signal) => {
          logger.debug(
            `[${shellId}] Process exited with code ${code} and signal ${signal}`,
          );

          processState.state.completed = true;
          processState.state.signaled = signal !== null;
          processState.state.exitCode = code;

          // Update shell tracker with completed status
          const status = code === 0 ? ShellStatus.COMPLETED : ShellStatus.ERROR;
          shellTracker.updateShellStatus(shellId, status, {
            exitCode: code,
            signaled: signal !== null,
          });

          // For test environment with timeout=0, we should still return sync results
          // when the process completes quickly
          if (!hasResolved) {
            hasResolved = true;
            // If we haven't resolved yet, this happened within the timeout
            // so return sync results
            resolve({
              mode: 'sync',
              stdout: processState.stdout.join('').trim(),
              stderr: processState.stderr.join('').trim(),
              exitCode: code ?? 1,
              ...(code !== 0 && {
                error: `Process exited with code ${code}${signal ? ` and signal ${signal}` : ''}`,
              }),
            });
          }
        });

        // For test environment, when timeout is explicitly set to 0, we want to force async mode
        if (timeout === 0) {
          // Force async mode immediately
          hasResolved = true;
          resolve({
            mode: 'async',
            shellId,
            stdout: processState.stdout.join('').trim(),
            stderr: processState.stderr.join('').trim(),
          });
        } else {
          // Set timeout to switch to async mode after the specified timeout
          setTimeout(() => {
            if (!hasResolved) {
              hasResolved = true;
              resolve({
                mode: 'async',
                shellId,
                stdout: processState.stdout.join('').trim(),
                stderr: processState.stderr.join('').trim(),
              });
            }
          }, timeout);
        }
      } catch (error) {
        logger.error(`Failed to start process: ${errorToString(error)}`);
        resolve({
          mode: 'sync',
          stdout: '',
          stderr: '',
          exitCode: 1,
          error: errorToString(error),
        });
      }
    });
  },

  logParameters: (
    {
      command,
      description,
      timeout = DEFAULT_TIMEOUT,
      showStdIn = false,
      showStdout = false,
      stdinContent,
    },
    { logger },
  ) => {
    logger.log(
      `Running "${command}", ${description} (timeout: ${timeout}ms, showStdIn: ${showStdIn}, showStdout: ${showStdout}${stdinContent ? ', with stdin content' : ''})`,
    );
  },
  logReturns: (output, { logger }) => {
    if (output.mode === 'async') {
      logger.log(`Process started with instance ID: ${output.shellId}`);
    } else {
      if (output.exitCode !== 0) {
        logger.error(`Process quit with exit code: ${output.exitCode}`);
      }
    }
  },
};
