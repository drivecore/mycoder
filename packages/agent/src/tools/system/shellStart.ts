import { spawn } from 'child_process';

import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { Tool } from '../../core/types.js';
import { formatGitHubText } from '../../utils/github.js';
import { errorToString } from '../../utils/errorToString.js';

import type { ChildProcess } from 'child_process';

// Define ProcessState type
type ProcessState = {
  process: ChildProcess;
  command: string;
  stdout: string[];
  stderr: string[];
  state: {
    completed: boolean;
    signaled: boolean;
    exitCode: number | null;
  };
};

// Global map to store process state
export const processStates: Map<string, ProcessState> = new Map();

const parameterSchema = z.object({
  command: z.string().describe('The shell command to execute'),
  description: z
    .string()
    .max(80)
    .describe('The reason this shell command is being run (max 80 chars)'),
  timeout: z
    .number()
    .optional()
    .describe(
      'Timeout in ms before switching to async mode (default: 10s, which usually is sufficient)',
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
      instanceId: z.string(),
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
    { command, timeout = DEFAULT_TIMEOUT },
    { logger, workingDirectory, githubMode },
  ): Promise<ReturnType> => {
    logger.verbose(`Starting shell command: ${command}`);

    // If GitHub mode is enabled and this is a GitHub CLI command,
    // ensure newlines are properly escaped for the platform
    let processedCommand = command;
    if (githubMode && command.startsWith('gh ')) {
      // Only process commands that might contain content with newlines
      if (command.includes('--body') || command.includes('--title') || command.includes('--comment')) {
        processedCommand = formatGitHubText(command);
        logger.verbose(`Processed GitHub command with platform-specific newlines`);
      }
    }

    return new Promise((resolve) => {
      try {
        const instanceId = uuidv4();
        let hasResolved = false;

        // Split command into command and args
        // Use command directly with shell: true
        const process = spawn(processedCommand, [], {
          shell: true,
          cwd: workingDirectory,
        });

        const processState: ProcessState = {
          command: processedCommand,
          process,
          stdout: [],
          stderr: [],
          state: { completed: false, signaled: false, exitCode: null },
        };

        // Initialize combined process state
        processStates.set(instanceId, processState);

        // Handle process events
        if (process.stdout)
          process.stdout.on('data', (data) => {
            const output = data.toString();
            processState.stdout.push(output);
            logger.verbose(`[${instanceId}] stdout: ${output.trim()}`);
          });

        if (process.stderr)
          process.stderr.on('data', (data) => {
            const output = data.toString();
            processState.stderr.push(output);
            logger.verbose(`[${instanceId}] stderr: ${output.trim()}`);
          });

        process.on('error', (error) => {
          logger.error(`[${instanceId}] Process error: ${error.message}`);
          processState.state.completed = true;
          if (!hasResolved) {
            hasResolved = true;
            resolve({
              mode: 'async',
              instanceId,
              stdout: processState.stdout.join('').trim(),
              stderr: processState.stderr.join('').trim(),
              error: error.message,
            });
          }
        });

        process.on('exit', (code, signal) => {
          logger.verbose(
            `[${instanceId}] Process exited with code ${code} and signal ${signal}`,
          );

          processState.state.completed = true;
          processState.state.signaled = signal !== null;
          processState.state.exitCode = code;

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

        // Set timeout to switch to async mode
        setTimeout(() => {
          if (!hasResolved) {
            hasResolved = true;
            resolve({
              mode: 'async',
              instanceId,
              stdout: processState.stdout.join('').trim(),
              stderr: processState.stderr.join('').trim(),
            });
          }
        }, timeout);
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
    { command, description, timeout = DEFAULT_TIMEOUT },
    { logger },
  ) => {
    logger.info(
      `Starting "${command}", ${description} (timeout: ${timeout}ms)`,
    );
  },
  logReturns: (output, { logger }) => {
    if (output.mode === 'async') {
      logger.info(`Process started with instance ID: ${output.instanceId}`);
    } else {
      logger.info(`Process completed with exit code: ${output.exitCode}`);
    }
  },
};
