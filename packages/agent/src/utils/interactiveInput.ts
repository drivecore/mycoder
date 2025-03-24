import * as readline from 'readline';
import { createInterface } from 'readline/promises';
import { Writable } from 'stream';

import chalk from 'chalk';

import {
  userMessages,
  cancelJobFlag,
} from '../tools/interaction/userMessage.js';

// Custom output stream to intercept console output
class OutputInterceptor extends Writable {
  private originalStdout: NodeJS.WriteStream;
  private paused: boolean = false;

  constructor(originalStdout: NodeJS.WriteStream) {
    super();
    this.originalStdout = originalStdout;
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  _write(
    chunk: Buffer | string,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    if (!this.paused) {
      this.originalStdout.write(chunk, encoding);
    }
    callback();
  }
}

// Initialize interactive input mode
export const initInteractiveInput = () => {
  // Save original stdout
  const originalStdout = process.stdout;

  // Create interceptor
  const interceptor = new OutputInterceptor(originalStdout);

  // We no longer try to replace process.stdout as it's not allowed in newer Node.js versions
  // Instead, we'll just use the interceptor for readline

  // Create readline interface for listening to key presses
  const rl = readline.createInterface({
    input: process.stdin,
    output: interceptor,
    terminal: true,
  });

  // Close the interface to avoid keeping the process alive
  rl.close();

  // Listen for keypress events
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  process.stdin.on('keypress', async (str, key) => {
    // Check for Ctrl+C to exit
    if (key.ctrl && key.name === 'c') {
      process.exit(0);
    }

    // Check for Ctrl+X to cancel job
    if (key.ctrl && key.name === 'x') {
      // Pause output
      interceptor.pause();

      // Create a readline interface for input
      const inputRl = createInterface({
        input: process.stdin,
        output: originalStdout,
      });

      try {
        // Reset cursor position and clear line
        originalStdout.write('\r\n');
        originalStdout.write(
          chalk.yellow(
            'Are you sure you want to cancel the current job? (y/n):\n',
          ) + '> ',
        );

        // Get user confirmation
        const confirmation = await inputRl.question('');

        if (confirmation.trim().toLowerCase() === 'y') {
          // Set cancel flag to true
          cancelJobFlag.value = true;

          // Create a readline interface for new instructions
          originalStdout.write(
            chalk.green('\nJob cancelled. Enter new instructions:\n') + '> ',
          );

          // Get new instructions
          const newInstructions = await inputRl.question('');

          // Add message to queue if not empty
          if (newInstructions.trim()) {
            userMessages.push(`[CANCEL JOB] ${newInstructions}`);
            originalStdout.write(
              chalk.green(
                '\nNew instructions sent. Resuming with new task...\n\n',
              ),
            );
          } else {
            originalStdout.write(
              chalk.yellow(
                '\nNo new instructions provided. Job will still be cancelled...\n\n',
              ),
            );
            userMessages.push(
              '[CANCEL JOB] Please stop the current task and wait for new instructions.',
            );
          }
        } else {
          originalStdout.write(
            chalk.green('\nCancellation aborted. Resuming output...\n\n'),
          );
        }
      } catch (error) {
        originalStdout.write(chalk.red(`\nError cancelling job: ${error}\n\n`));
      } finally {
        // Close input readline interface
        inputRl.close();

        // Resume output
        interceptor.resume();
      }
    }

    // Check for Ctrl+M to enter message mode
    if (key.ctrl && key.name === 'm') {
      // Pause output
      interceptor.pause();

      // Create a readline interface for input
      const inputRl = createInterface({
        input: process.stdin,
        output: originalStdout,
      });

      try {
        // Reset cursor position and clear line
        originalStdout.write('\r\n');
        originalStdout.write(
          chalk.green(
            'Enter correction or additional context (Ctrl+C to cancel):\n',
          ) + '> ',
        );

        // Get user input
        const userInput = await inputRl.question('');

        // Add message to queue if not empty
        if (userInput.trim()) {
          userMessages.push(userInput);
          originalStdout.write(
            chalk.green('\nMessage sent to agent. Resuming output...\n\n'),
          );
        } else {
          originalStdout.write(
            chalk.yellow('\nEmpty message not sent. Resuming output...\n\n'),
          );
        }
      } catch (error) {
        originalStdout.write(
          chalk.red(`\nError sending message: ${error}\n\n`),
        );
      } finally {
        // Close input readline interface
        inputRl.close();

        // Resume output
        interceptor.resume();
      }
    }
  });

  // Return a cleanup function
  return () => {
    // We no longer need to restore process.stdout

    // Disable raw mode
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
  };
};
