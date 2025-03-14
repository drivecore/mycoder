import { v4 as uuidv4 } from 'uuid';

// These imports will be used by the cleanup method
import { agentStates } from '../tools/interaction/agentStart.js';
import { processStates } from '../tools/system/shellStart.js';

// Types of background processes we can track
export enum BackgroundToolType {
  SHELL = 'shell',
  AGENT = 'agent',
}

// Status of a background process
export enum BackgroundToolStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  ERROR = 'error',
  TERMINATED = 'terminated',
}

// Common interface for all background processes
export interface BackgroundTool {
  id: string;
  type: BackgroundToolType;
  status: BackgroundToolStatus;
  startTime: Date;
  endTime?: Date;
  metadata: Record<string, any>; // Additional tool-specific information
}

// Shell process specific data
export interface ShellBackgroundTool extends BackgroundTool {
  type: BackgroundToolType.SHELL;
  metadata: {
    command: string;
    exitCode?: number | null;
    signaled?: boolean;
    error?: string;
  };
}

// Agent process specific data (for future use)
export interface AgentBackgroundTool extends BackgroundTool {
  type: BackgroundToolType.AGENT;
  metadata: {
    goal?: string;
    error?: string;
  };
}

// Utility type for all background tool types
export type AnyBackgroundTool = ShellBackgroundTool | AgentBackgroundTool;

/**
 * Registry to keep track of all background processes
 */
export class BackgroundTools {
  tools: Map<string, AnyBackgroundTool> = new Map();

  // Private constructor for singleton pattern
  constructor(readonly ownerName: string) {}

  // Register a new shell process
  public registerShell(command: string): string {
    const id = uuidv4();
    const tool: ShellBackgroundTool = {
      id,
      type: BackgroundToolType.SHELL,
      status: BackgroundToolStatus.RUNNING,
      startTime: new Date(),
      metadata: {
        command,
      },
    };
    this.tools.set(id, tool);
    return id;
  }

  // Register a new agent process (for future use)
  public registerAgent(goal?: string): string {
    const id = uuidv4();
    const tool: AgentBackgroundTool = {
      id,
      type: BackgroundToolType.AGENT,
      status: BackgroundToolStatus.RUNNING,
      startTime: new Date(),
      metadata: {
        goal,
      },
    };
    this.tools.set(id, tool);
    return id;
  }

  // Update the status of a process
  public updateToolStatus(
    id: string,
    status: BackgroundToolStatus,
    metadata?: Record<string, any>,
  ): boolean {
    const tool = this.tools.get(id);
    if (!tool) {
      return false;
    }

    tool.status = status;

    if (
      status === BackgroundToolStatus.COMPLETED ||
      status === BackgroundToolStatus.ERROR ||
      status === BackgroundToolStatus.TERMINATED
    ) {
      tool.endTime = new Date();
    }

    if (metadata) {
      tool.metadata = { ...tool.metadata, ...metadata };
    }

    return true;
  }

  public getTools(): AnyBackgroundTool[] {
    const result: AnyBackgroundTool[] = [];
    for (const tool of this.tools.values()) {
      result.push(tool);
    }
    return result;
  }

  // Get a specific process by ID
  public getToolById(id: string): AnyBackgroundTool | undefined {
    return this.tools.get(id);
  }

  /**
   * Cleans up all resources associated with this agent instance
   * @returns A promise that resolves when cleanup is complete
   */
  public async cleanup(): Promise<void> {
    const tools = this.getTools();

    // Group tools by type for better cleanup organization
    const shellTools = tools.filter(
      (tool): tool is ShellBackgroundTool =>
        tool.type === BackgroundToolType.SHELL &&
        tool.status === BackgroundToolStatus.RUNNING,
    );

    const agentTools = tools.filter(
      (tool): tool is AgentBackgroundTool =>
        tool.type === BackgroundToolType.AGENT &&
        tool.status === BackgroundToolStatus.RUNNING,
    );

    // Create cleanup promises for each resource type
    const shellCleanupPromises = shellTools.map((tool) =>
      this.cleanupShellProcess(tool),
    );
    const agentCleanupPromises = agentTools.map((tool) =>
      this.cleanupSubAgent(tool),
    );

    // Wait for all cleanup operations to complete in parallel
    await Promise.all([...shellCleanupPromises, ...agentCleanupPromises]);
  }

  /**
   * Cleans up a shell process
   * @param tool The shell tool to clean up
   */
  private async cleanupShellProcess(tool: ShellBackgroundTool): Promise<void> {
    try {
      const processState = processStates.get(tool.id);
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
      this.updateToolStatus(tool.id, BackgroundToolStatus.COMPLETED);
    } catch (error) {
      this.updateToolStatus(tool.id, BackgroundToolStatus.ERROR, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Cleans up a sub-agent
   * @param tool The agent tool to clean up
   */
  private async cleanupSubAgent(tool: AgentBackgroundTool): Promise<void> {
    try {
      const agentState = agentStates.get(tool.id);
      if (agentState && !agentState.aborted) {
        // Set the agent as aborted and completed
        agentState.aborted = true;
        agentState.completed = true;

        // Clean up resources owned by this sub-agent
        await agentState.context.backgroundTools.cleanup();
      }
      this.updateToolStatus(tool.id, BackgroundToolStatus.TERMINATED);
    } catch (error) {
      this.updateToolStatus(tool.id, BackgroundToolStatus.ERROR, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
