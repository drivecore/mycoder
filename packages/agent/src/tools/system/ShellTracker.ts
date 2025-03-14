import { v4 as uuidv4 } from 'uuid';

import type { ChildProcess } from 'child_process';

// Status of a shell process
export enum ShellStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  ERROR = 'error',
  TERMINATED = 'terminated',
}

// Define ProcessState type
export type ProcessState = {
  process: ChildProcess;
  command: string;
  stdout: string[];
  stderr: string[];
  state: {
    completed: boolean;
    signaled: boolean;
    exitCode: number | null;
  };
  showStdIn: boolean;
  showStdout: boolean;
};

// Shell process specific data
export interface ShellProcess {
  id: string;
  status: ShellStatus;
  startTime: Date;
  endTime?: Date;
  metadata: {
    command: string;
    exitCode?: number | null;
    signaled?: boolean;
    error?: string;
    [key: string]: any; // Additional shell-specific information
  };
}

/**
 * Registry to keep track of shell processes
 */
export class ShellTracker {
  private static instance: ShellTracker;
  private shells: Map<string, ShellProcess> = new Map();
  public processStates: Map<string, ProcessState> = new Map();

  // Private constructor for singleton pattern
  private constructor() {}

  // Get the singleton instance
  public static getInstance(): ShellTracker {
    if (!ShellTracker.instance) {
      ShellTracker.instance = new ShellTracker();
    }
    return ShellTracker.instance;
  }

  // Register a new shell process
  public registerShell(command: string): string {
    const id = uuidv4();
    const shell: ShellProcess = {
      id,
      status: ShellStatus.RUNNING,
      startTime: new Date(),
      metadata: {
        command,
      },
    };
    this.shells.set(id, shell);
    return id;
  }

  // Update the status of a shell process
  public updateShellStatus(
    id: string,
    status: ShellStatus,
    metadata?: Record<string, any>,
  ): boolean {
    const shell = this.shells.get(id);
    if (!shell) {
      return false;
    }

    shell.status = status;

    if (
      status === ShellStatus.COMPLETED ||
      status === ShellStatus.ERROR ||
      status === ShellStatus.TERMINATED
    ) {
      shell.endTime = new Date();
    }

    if (metadata) {
      shell.metadata = { ...shell.metadata, ...metadata };
    }

    return true;
  }

  // Get all shell processes
  public getShells(status?: ShellStatus): ShellProcess[] {
    const result: ShellProcess[] = [];
    for (const shell of this.shells.values()) {
      if (!status || shell.status === status) {
        result.push(shell);
      }
    }
    return result;
  }

  // Get a specific shell process by ID
  public getShellById(id: string): ShellProcess | undefined {
    return this.shells.get(id);
  }

  /**
   * Cleans up a shell process
   * @param id The ID of the shell process to clean up
   */
  public async cleanupShellProcess(id: string): Promise<void> {
    try {
      const shell = this.shells.get(id);
      if (!shell) {
        return;
      }

      const processState = this.processStates.get(id);
      if (processState && !processState.state.completed) {
        processState.process.kill('SIGTERM');

        // Force kill after a short timeout if still running
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            try {
              if (!processState.state.completed) {
                processState.process.kill('SIGKILL');
              }
            } catch {
              // Ignore errors on forced kill
            }
            resolve();
          }, 500);
        });
      }
      this.updateShellStatus(id, ShellStatus.TERMINATED);
    } catch (error) {
      this.updateShellStatus(id, ShellStatus.ERROR, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Cleans up all running shell processes
   */
  public async cleanupAllShells(): Promise<void> {
    const runningShells = this.getShells(ShellStatus.RUNNING);
    const cleanupPromises = runningShells.map((shell) =>
      this.cleanupShellProcess(shell.id),
    );
    await Promise.all(cleanupPromises);
  }
}

// Export a singleton instance
export const shellTracker = ShellTracker.getInstance();
