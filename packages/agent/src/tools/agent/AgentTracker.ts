import { v4 as uuidv4 } from 'uuid';

import { ToolAgentResult } from '../../core/toolAgent/types.js';
import { ToolContext } from '../../core/types.js';

export enum AgentStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  ERROR = 'error',
  TERMINATED = 'terminated',
}

export interface AgentInfo {
  // Basic identification and status
  agentId: string;
  status: AgentStatus;
  startTime: Date;
  endTime?: Date;
  goal: string;

  // Result information
  result?: string;
  error?: string;

  // Internal state information
  prompt?: string;
  output: string;
  capturedLogs: string[]; // Captured log messages from agent and immediate tools
  completed: boolean;
  result_detailed?: ToolAgentResult;
  context?: ToolContext;
  workingDirectory?: string;
  tools?: unknown[];
  aborted: boolean;
  parentMessages: string[]; // Messages from parent agent
}

// For backward compatibility - these are deprecated and will be removed in a future version
/** @deprecated Use AgentInfo instead */
export type Agent = AgentInfo;
/** @deprecated Use AgentInfo instead */
export type AgentState = AgentInfo;

export class AgentTracker {
  private agentInfos: Map<string, AgentInfo> = new Map();

  constructor(public ownerAgentId: string | undefined) {}

  /**
   * Register a new agent with basic information or update an existing agent with full state
   * @param goalOrState Either a goal string or a complete AgentInfo object
   * @param state Optional additional state information to set
   * @returns The agent ID
   */
  public registerAgent(
    goalOrState: string | Partial<AgentInfo>,
    state?: Partial<AgentInfo>,
  ): string {
    let agentId: string;

    // Case 1: Simple registration with just a goal string
    if (typeof goalOrState === 'string') {
      agentId = uuidv4();

      // Create basic agent info entry
      const agentInfo: AgentInfo = {
        agentId,
        status: AgentStatus.RUNNING,
        startTime: new Date(),
        goal: goalOrState,
        // Initialize arrays and default values
        capturedLogs: [],
        completed: false,
        aborted: false,
        parentMessages: [],
        output: '',
      };

      this.agentInfos.set(agentId, agentInfo);
    }
    // Case 2: Registration with a partial or complete AgentInfo object
    else {
      if (goalOrState.agentId) {
        // Use existing ID if provided
        agentId = goalOrState.agentId;

        // Check if agent already exists
        const existingAgent = this.agentInfos.get(agentId);

        if (existingAgent) {
          // Update existing agent
          Object.assign(existingAgent, goalOrState);
        } else {
          // Create new agent with provided ID
          const newAgent: AgentInfo = {
            // Set defaults for required fields
            agentId,
            status: AgentStatus.RUNNING,
            startTime: new Date(),
            goal: goalOrState.goal || 'Unknown goal',
            capturedLogs: [],
            completed: false,
            aborted: false,
            parentMessages: [],
            output: '',
            // Merge in provided values
            ...goalOrState,
          };

          this.agentInfos.set(agentId, newAgent);
        }
      } else {
        // Generate new ID if not provided
        agentId = uuidv4();

        // Create new agent
        const newAgent: AgentInfo = {
          // Set defaults for required fields
          agentId,
          status: AgentStatus.RUNNING,
          startTime: new Date(),
          goal: goalOrState.goal || 'Unknown goal',
          capturedLogs: [],
          completed: false,
          aborted: false,
          parentMessages: [],
          output: '',
          // Merge in provided values
          ...goalOrState,
        };

        this.agentInfos.set(agentId, newAgent);
      }
    }

    // Apply additional state if provided
    if (state) {
      const agent = this.agentInfos.get(agentId);
      if (agent) {
        Object.assign(agent, state);
      }
    }

    return agentId;
  }

  // Update agent status
  public updateAgentStatus(
    agentId: string,
    status: AgentStatus,
    metadata?: { result?: string; error?: string },
  ): boolean {
    const agentInfo = this.agentInfos.get(agentId);
    if (!agentInfo) {
      return false;
    }

    agentInfo.status = status;

    if (
      status === AgentStatus.COMPLETED ||
      status === AgentStatus.ERROR ||
      status === AgentStatus.TERMINATED
    ) {
      agentInfo.endTime = new Date();
    }

    if (metadata) {
      if (metadata.result !== undefined) agentInfo.result = metadata.result;
      if (metadata.error !== undefined) agentInfo.error = metadata.error;
    }

    return true;
  }

  /**
   * Get an agent by ID
   * @param agentId The agent ID
   * @returns The agent info or undefined if not found
   */
  public getAgent(agentId: string): AgentInfo | undefined {
    return this.agentInfos.get(agentId);
  }

  /**
   * Get all agents, optionally filtered by status
   * @param status Optional status to filter by
   * @returns Array of agents
   */
  public getAgents(status?: AgentStatus): AgentInfo[] {
    const agents = Array.from(this.agentInfos.values());

    if (!status) {
      return agents;
    }

    return agents.filter((agent) => agent.status === status);
  }

  // Cleanup and terminate agents
  public async cleanup(): Promise<void> {
    const runningAgents = this.getAgents(AgentStatus.RUNNING);

    await Promise.all(
      runningAgents.map((agent) => this.terminateAgent(agent.agentId)),
    );
  }

  // Terminate a specific agent
  public async terminateAgent(agentId: string): Promise<void> {
    try {
      const agentInfo = this.agentInfos.get(agentId);
      if (agentInfo && !agentInfo.aborted) {
        // Set the agent as aborted and completed
        agentInfo.aborted = true;
        agentInfo.completed = true;

        // Clean up resources owned by this sub-agent
        if (agentInfo.context) {
          await agentInfo.context.agentTracker.cleanup();
          await agentInfo.context.shellTracker.cleanup();
          await agentInfo.context.browserTracker.cleanup();
        }
      }
      this.updateAgentStatus(agentId, AgentStatus.TERMINATED);
    } catch (error) {
      this.updateAgentStatus(agentId, AgentStatus.ERROR, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
