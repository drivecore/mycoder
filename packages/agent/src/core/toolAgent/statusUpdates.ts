/**
 * Status update mechanism for agents
 */

import { Message } from '../llm/types.js';
import { TokenTracker } from '../tokens.js';
import { ToolContext } from '../types.js';
import { AgentStatus } from '../../tools/agent/AgentTracker.js';
import { ShellStatus } from '../../tools/shell/ShellTracker.js';
import { SessionStatus } from '../../tools/session/SessionTracker.js';

/**
 * Generate a status update message for the agent
 */
export function generateStatusUpdate(
  totalTokens: number,
  maxTokens: number,
  tokenTracker: TokenTracker,
  context: ToolContext
): Message {
  // Calculate token usage percentage
  const usagePercentage = Math.round((totalTokens / maxTokens) * 100);
  
  // Get active sub-agents
  const activeAgents = context.agentTracker 
    ? getActiveAgents(context) 
    : [];
  
  // Get active shell processes
  const activeShells = context.shellTracker 
    ? getActiveShells(context) 
    : [];
  
  // Get active browser sessions
  const activeSessions = context.browserTracker 
    ? getActiveSessions(context) 
    : [];
  
  // Format the status message
  const statusContent = [
    `--- STATUS UPDATE ---`,
    `Token Usage: ${formatNumber(totalTokens)}/${formatNumber(maxTokens)} (${usagePercentage}%)`,
    `Cost So Far: ${tokenTracker.getTotalCost()}`,
    ``,
    `Active Sub-Agents: ${activeAgents.length}`,
    ...activeAgents.map(a => `- ${a.id}: ${a.description}`),
    ``,
    `Active Shell Processes: ${activeShells.length}`,
    ...activeShells.map(s => `- ${s.id}: ${s.description}`),
    ``,
    `Active Browser Sessions: ${activeSessions.length}`,
    ...activeSessions.map(s => `- ${s.id}: ${s.description}`),
    ``,
    `If token usage is high (>70%), consider using the 'compactHistory' tool to reduce context size.`,
    `--- END STATUS ---`,
  ].join('\n');
  
  return {
    role: 'system',
    content: statusContent,
  };
}

/**
 * Format a number with commas for thousands
 */
function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Get active agents from the agent tracker
 */
function getActiveAgents(context: ToolContext) {
  const agents = context.agentTracker.getAgents(AgentStatus.RUNNING);
  return agents.map(agent => ({
    id: agent.id,
    description: agent.goal,
    status: agent.status
  }));
}

/**
 * Get active shells from the shell tracker
 */
function getActiveShells(context: ToolContext) {
  const shells = context.shellTracker.getShells(ShellStatus.RUNNING);
  return shells.map(shell => ({
    id: shell.id,
    description: shell.metadata.command,
    status: shell.status
  }));
}

/**
 * Get active browser sessions from the session tracker
 */
function getActiveSessions(context: ToolContext) {
  const sessions = context.browserTracker.getSessionsByStatus(SessionStatus.RUNNING);
  return sessions.map(session => ({
    id: session.id,
    description: session.metadata.url || 'No URL',
    status: session.status
  }));
}