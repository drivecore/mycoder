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
  shellId: string;
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
  private shells: Map<string, ShellProcess> = new Map();
  public processStates: Map<string, ProcessState> = new Map();

  constructor(public ownerAgentId: string | undefined) {}

  // Register a new shell process
  public registerShell(command: string): string {
    const shellId = uuidv4();
    const shell: ShellProcess = {
      shellId,
      status: ShellStatus.RUNNING,
      startTime: new Date(),
      metadata: {
        command,
      },
    };
    this.shells.set(shellId, shell);
    return shellId;
  }

  // Update the status of a shell process
  public updateShellStatus(
    shellId: string,
    status: ShellStatus,
    metadata?: Record<string, any>,
  ): boolean {
    const shell = this.shells.get(shellId);
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
  public getShellById(shellId: string): ShellProcess | undefined {
    return this.shells.get(shellId);
  }

  /**
   * Cleans up a shell process
   * @param shellId The ID of the shell process to clean up
   */
  public async cleanupShellProcess(shellId: string): Promise<void> {
    try {
      const shell = this.shells.get(shellId);
      if (!shell) {
        return;
      }

      const processState = this.processStates.get(shellId);
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
      this.updateShellStatus(shellId, ShellStatus.TERMINATED);
    } catch (error) {
      this.updateShellStatus(shellId, ShellStatus.ERROR, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Cleans up all running shell processes
   */
  public async cleanup(): Promise<void> {
    const runningShells = this.getShells(ShellStatus.RUNNING);
    const cleanupPromises = runningShells.map((shell) =>
      this.cleanupShellProcess(shell.shellId),
    );
    await Promise.all(cleanupPromises);
  }
}
