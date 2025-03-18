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
  id: string;
  status: AgentStatus;
  startTime: Date;
  endTime?: Date;
  goal: string;
  result?: string;
  error?: string;
}

// Internal agent state tracking (similar to existing agentStates)
export interface AgentState {
  id: string;
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
    const id = uuidv4();

    // Create agent tracking entry
    const agent: Agent = {
      id,
      status: AgentStatus.RUNNING,
      startTime: new Date(),
      goal,
    };

    this.agents.set(id, agent);
    return id;
  }

  // Register agent state
  public registerAgentState(id: string, state: AgentState): void {
    this.agentStates.set(id, state);
  }

  // Update agent status
  public updateAgentStatus(
    id: string,
    status: AgentStatus,
    metadata?: { result?: string; error?: string },
  ): boolean {
    const agent = this.agents.get(id);
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
  public getAgentState(id: string): AgentState | undefined {
    return this.agentStates.get(id);
  }

  // Get a specific agent tracking info
  public getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
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

  // Cleanup and terminate agents
  public async cleanup(): Promise<void> {
    const runningAgents = this.getAgents(AgentStatus.RUNNING);

    await Promise.all(
      runningAgents.map((agent) => this.terminateAgent(agent.id)),
    );
  }

  // Terminate a specific agent
  public async terminateAgent(id: string): Promise<void> {
    try {
      const agentState = this.agentStates.get(id);
      if (agentState && !agentState.aborted) {
        // Set the agent as aborted and completed
        agentState.aborted = true;
        agentState.completed = true;

        // Clean up resources owned by this sub-agent
        await agentState.context.agentTracker.cleanup();
        await agentState.context.shellTracker.cleanup();
        await agentState.context.browserTracker.cleanup();
      }
      this.updateAgentStatus(id, AgentStatus.TERMINATED);
    } catch (error) {
      this.updateAgentStatus(id, AgentStatus.ERROR, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
