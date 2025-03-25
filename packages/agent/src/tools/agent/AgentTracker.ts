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
  prompt: string;
  output: string;
  capturedLogs: string[]; // Captured log messages from agent and immediate tools
  completed: boolean;
  result_detailed?: ToolAgentResult;
  context: ToolContext;
  workingDirectory: string;
  tools: unknown[];
  aborted: boolean;
  parentMessages: string[]; // Messages from parent agent
}

// For backward compatibility
export type Agent = Pick<
  AgentInfo,
  'agentId' | 'status' | 'startTime' | 'endTime' | 'goal' | 'result' | 'error'
>;
export type AgentState = Pick<
  AgentInfo,
  | 'agentId'
  | 'goal'
  | 'prompt'
  | 'output'
  | 'capturedLogs'
  | 'completed'
  | 'error'
  | 'context'
  | 'workingDirectory'
  | 'tools'
  | 'aborted'
  | 'parentMessages'
> & { result?: ToolAgentResult };

export class AgentTracker {
  private agentInfos: Map<string, AgentInfo> = new Map();

  constructor(public ownerAgentId: string | undefined) {}

  // Register a new agent
  public registerAgent(goal: string): string {
    const agentId = uuidv4();

    // Create basic agent info entry
    const agentInfo: Partial<AgentInfo> = {
      agentId: agentId,
      status: AgentStatus.RUNNING,
      startTime: new Date(),
      goal,
      // Initialize arrays and default values
      capturedLogs: [],
      completed: false,
      aborted: false,
      parentMessages: [],
      output: '',
    };

    this.agentInfos.set(agentId, agentInfo as AgentInfo);
    return agentId;
  }

  // Register agent state - for backward compatibility
  public registerAgentState(agentId: string, state: AgentState): void {
    const agentInfo = this.agentInfos.get(agentId);

    if (!agentInfo) {
      // If agent doesn't exist yet (shouldn't happen in normal flow), create it
      const newAgentInfo: AgentInfo = {
        agentId: state.agentId,
        status: AgentStatus.RUNNING,
        startTime: new Date(),
        goal: state.goal,
        prompt: state.prompt,
        output: state.output,
        capturedLogs: state.capturedLogs,
        completed: state.completed,
        error: state.error,
        result_detailed: state.result,
        context: state.context,
        workingDirectory: state.workingDirectory,
        tools: state.tools,
        aborted: state.aborted,
        parentMessages: state.parentMessages,
      };
      this.agentInfos.set(agentId, newAgentInfo);
      return;
    }

    // Update existing agent info with state data
    Object.assign(agentInfo, {
      goal: state.goal,
      prompt: state.prompt,
      output: state.output,
      capturedLogs: state.capturedLogs,
      completed: state.completed,
      error: state.error,
      result_detailed: state.result,
      context: state.context,
      workingDirectory: state.workingDirectory,
      tools: state.tools,
      aborted: state.aborted,
      parentMessages: state.parentMessages,
    });
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

  // Get a specific agent info
  public getAgentInfo(agentId: string): AgentInfo | undefined {
    return this.agentInfos.get(agentId);
  }

  // Get a specific agent state - for backward compatibility
  public getAgentState(agentId: string): AgentState | undefined {
    const agentInfo = this.agentInfos.get(agentId);
    if (!agentInfo) return undefined;

    // Convert AgentInfo to AgentState
    const state: AgentState = {
      agentId: agentInfo.agentId,
      goal: agentInfo.goal,
      prompt: agentInfo.prompt,
      output: agentInfo.output,
      capturedLogs: agentInfo.capturedLogs,
      completed: agentInfo.completed,
      error: agentInfo.error,
      result: agentInfo.result_detailed,
      context: agentInfo.context,
      workingDirectory: agentInfo.workingDirectory,
      tools: agentInfo.tools,
      aborted: agentInfo.aborted,
      parentMessages: agentInfo.parentMessages,
    };

    return state;
  }

  // Get a specific agent tracking info - for backward compatibility
  public getAgent(agentId: string): Agent | undefined {
    const agentInfo = this.agentInfos.get(agentId);
    if (!agentInfo) return undefined;

    // Convert AgentInfo to Agent
    const agent: Agent = {
      agentId: agentInfo.agentId,
      status: agentInfo.status,
      startTime: agentInfo.startTime,
      endTime: agentInfo.endTime,
      goal: agentInfo.goal,
      result: agentInfo.result,
      error: agentInfo.error,
    };

    return agent;
  }

  // Get all agents with optional filtering
  public getAgents(status?: AgentStatus): Agent[] {
    const agents = Array.from(this.agentInfos.values()).map((info) => ({
      agentId: info.agentId,
      status: info.status,
      startTime: info.startTime,
      endTime: info.endTime,
      goal: info.goal,
      result: info.result,
      error: info.error,
    }));

    if (!status) {
      return agents;
    }

    return agents.filter((agent) => agent.status === status);
  }

  /**
   * Get list of active agents with their descriptions
   */
  public getActiveAgents(): Array<{
    agentId: string;
    description: string;
    status: AgentStatus;
  }> {
    return Array.from(this.agentInfos.values())
      .filter((info) => info.status === AgentStatus.RUNNING)
      .map((info) => ({
        agentId: info.agentId,
        description: info.goal,
        status: info.status,
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
      const agentInfo = this.agentInfos.get(agentId);
      if (agentInfo && !agentInfo.aborted) {
        // Set the agent as aborted and completed
        agentInfo.aborted = true;
        agentInfo.completed = true;

        // Clean up resources owned by this sub-agent
        await agentInfo.context.agentTracker.cleanup();
        await agentInfo.context.shellTracker.cleanup();
        await agentInfo.context.browserTracker.cleanup();
      }
      this.updateAgentStatus(agentId, AgentStatus.TERMINATED);
    } catch (error) {
      this.updateAgentStatus(agentId, AgentStatus.ERROR, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
