import { v4 as uuidv4 } from 'uuid';

// Types of background processes we can track
export enum BackgroundToolType {
  SHELL = 'shell',
  BROWSER = 'browser',
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
  agentId: string; // To track which agent created this process
  metadata: Record<string, any>; // Additional tool-specific information
}

// Shell process specific data
export interface ShellBackgroundTool extends BackgroundTool {
  type: BackgroundToolType.SHELL;
  metadata: {
    command: string;
    exitCode?: number | null;
    signaled?: boolean;
  };
}

// Browser process specific data
export interface BrowserBackgroundTool extends BackgroundTool {
  type: BackgroundToolType.BROWSER;
  metadata: {
    url?: string;
  };
}

// Agent process specific data (for future use)
export interface AgentBackgroundTool extends BackgroundTool {
  type: BackgroundToolType.AGENT;
  metadata: {
    goal?: string;
  };
}

// Utility type for all background tool types
export type AnyBackgroundTool =
  | ShellBackgroundTool
  | BrowserBackgroundTool
  | AgentBackgroundTool;

/**
 * Registry to keep track of all background processes
 */
export class BackgroundToolRegistry {
  private static instance: BackgroundToolRegistry;
  private tools: Map<string, AnyBackgroundTool> = new Map();

  // Private constructor for singleton pattern
  private constructor() {}

  // Get the singleton instance
  public static getInstance(): BackgroundToolRegistry {
    if (!BackgroundToolRegistry.instance) {
      BackgroundToolRegistry.instance = new BackgroundToolRegistry();
    }
    return BackgroundToolRegistry.instance;
  }

  // Register a new shell process
  public registerShell(agentId: string, command: string): string {
    const id = uuidv4();
    const tool: ShellBackgroundTool = {
      id,
      type: BackgroundToolType.SHELL,
      status: BackgroundToolStatus.RUNNING,
      startTime: new Date(),
      agentId,
      metadata: {
        command,
      },
    };
    this.tools.set(id, tool);
    return id;
  }

  // Register a new browser process
  public registerBrowser(agentId: string, url?: string): string {
    const id = uuidv4();
    const tool: BrowserBackgroundTool = {
      id,
      type: BackgroundToolType.BROWSER,
      status: BackgroundToolStatus.RUNNING,
      startTime: new Date(),
      agentId,
      metadata: {
        url,
      },
    };
    this.tools.set(id, tool);
    return id;
  }

  // Register a new agent process (for future use)
  public registerAgent(agentId: string, goal?: string): string {
    const id = uuidv4();
    const tool: AgentBackgroundTool = {
      id,
      type: BackgroundToolType.AGENT,
      status: BackgroundToolStatus.RUNNING,
      startTime: new Date(),
      agentId,
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

  // Get all processes for a specific agent
  public getToolsByAgent(agentId: string): AnyBackgroundTool[] {
    const result: AnyBackgroundTool[] = [];
    for (const tool of this.tools.values()) {
      if (tool.agentId === agentId) {
        result.push(tool);
      }
    }
    return result;
  }

  // Get a specific process by ID
  public getToolById(id: string): AnyBackgroundTool | undefined {
    return this.tools.get(id);
  }

  // Clean up completed processes (optional, for maintenance)
  public cleanupOldTools(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

    for (const [id, tool] of this.tools.entries()) {
      // Remove if it's completed/error/terminated AND older than cutoff
      if (
        tool.endTime &&
        tool.endTime < cutoffTime &&
        (tool.status === BackgroundToolStatus.COMPLETED ||
          tool.status === BackgroundToolStatus.ERROR ||
          tool.status === BackgroundToolStatus.TERMINATED)
      ) {
        this.tools.delete(id);
      }
    }
  }
}

// Export singleton instance
export const backgroundToolRegistry = BackgroundToolRegistry.getInstance();
