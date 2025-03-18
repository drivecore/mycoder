import * as readline from 'readline';
import { createInterface } from 'readline/promises';
import { Writable } from 'stream';

import chalk from 'chalk';

import { userMessages } from '../tools/interaction/userMessage.js';

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

  // Replace stdout with our interceptor
  // @ts-expect-error - This is a hack to replace stdout
  process.stdout = interceptor;

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
    // Restore original stdout
    process.stdout = originalStdout;

    // Disable raw mode
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
  };
};
