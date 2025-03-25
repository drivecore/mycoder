import { v4 as uuidv4 } from 'uuid';

import { ToolAgentResult } from '../../core/toolAgent/types.js';
import { ToolContext } from '../../core/types.js';

export enum AgentStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  ERROR = 'error',
  TERMINATED = 'terminated',
}

export interface Agent {
  agentId: string;
  status: AgentStatus;
  startTime: Date;
  endTime?: Date;
  goal: string;
  result?: string;
  error?: string;
}

// Internal agent state tracking (similar to existing agentStates)
export interface AgentState {
  agentId: string;
  goal: string;
  prompt: string;
  output: string;
  capturedLogs: string[]; // Captured log messages from agent and immediate tools
  completed: boolean;
  error?: string;
  result?: ToolAgentResult;
  context: ToolContext;
  workingDirectory: string;
  tools: unknown[];
  aborted: boolean;
  parentMessages: string[]; // Messages from parent agent
}

export class AgentTracker {
  private agents: Map<string, Agent> = new Map();
  private agentStates: Map<string, AgentState> = new Map();

  constructor(public ownerAgentId: string | undefined) {}

  // Register a new agent
  public registerAgent(goal: string): string {
    const agentId = uuidv4();

    // Create agent tracking entry
    const agent: Agent = {
      agentId: agentId,
      status: AgentStatus.RUNNING,
      startTime: new Date(),
      goal,
    };

    this.agents.set(agentId, agent);
    return agentId;
  }

  // Register agent state
  public registerAgentState(agentId: string, state: AgentState): void {
    this.agentStates.set(agentId, state);
  }

  // Update agent status
  public updateAgentStatus(
    agentId: string,
    status: AgentStatus,
    metadata?: { result?: string; error?: string },
  ): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }

    agent.status = status;

    if (
      status === AgentStatus.COMPLETED ||
      status === AgentStatus.ERROR ||
      status === AgentStatus.TERMINATED
    ) {
      agent.endTime = new Date();
    }

    if (metadata) {
      if (metadata.result !== undefined) agent.result = metadata.result;
      if (metadata.error !== undefined) agent.error = metadata.error;
    }

    return true;
  }

  // Get a specific agent state
  public getAgentState(agentId: string): AgentState | undefined {
    return this.agentStates.get(agentId);
  }

  // Get a specific agent tracking info
  public getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  // Get all agents with optional filtering
  public getAgents(status?: AgentStatus): Agent[] {
    if (!status) {
      return Array.from(this.agents.values());
    }

    return Array.from(this.agents.values()).filter(
      (agent) => agent.status === status,
    );
  }

  /**
   * Get list of active agents with their descriptions
   */
  public getActiveAgents(): Array<{
    agentId: string;
    description: string;
    status: AgentStatus;
  }> {
    return this.getAgents(AgentStatus.RUNNING).map((agent) => ({
      agentId: agent.agentId,
      description: agent.goal,
      status: agent.status,
    }));
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
      const agentState = this.agentStates.get(agentId);
      if (agentState && !agentState.aborted) {
        // Set the agent as aborted and completed
        agentState.aborted = true;
        agentState.completed = true;

        // Clean up resources owned by this sub-agent
        await agentState.context.agentTracker.cleanup();
        await agentState.context.shellTracker.cleanup();
        await agentState.context.browserTracker.cleanup();
      }
      this.updateAgentStatus(agentId, AgentStatus.TERMINATED);
    } catch (error) {
      this.updateAgentStatus(agentId, AgentStatus.ERROR, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
