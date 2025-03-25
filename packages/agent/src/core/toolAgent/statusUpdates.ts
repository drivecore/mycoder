/**
 * Status update mechanism for agents
 */

import { AgentStatus } from '../../tools/agent/AgentTracker.js';
import { SessionStatus } from '../../tools/session/SessionTracker.js';
import { ShellStatus } from '../../tools/shell/ShellTracker.js';
import { Message } from '../llm/types.js';
import { TokenTracker } from '../tokens.js';
import { ToolContext } from '../types.js';

/**
 * Generate a status update message for the agent
 */
export function generateStatusUpdate(
  totalTokens: number,
  contextWindow: number | undefined,
  tokenTracker: TokenTracker,
  context: ToolContext,
): Message {
  // Calculate token usage percentage
  const usagePercentage = contextWindow
    ? Math.round((totalTokens / contextWindow) * 100)
    : undefined;

  // Get active sub-agents
  const activeAgents = context.agentTracker
    ? context.agentTracker.getAgents(AgentStatus.RUNNING)
    : [];

  // Get active shell processes
  const activeShells = context.shellTracker
    ? context.shellTracker.getShells(ShellStatus.RUNNING)
    : [];

  console.log('activeShells', activeShells);

  // Get active browser sessions
  const activeSessions = context.browserTracker
    ? context.browserTracker.getSessionsByStatus(SessionStatus.RUNNING)
    : [];

  console.log('activeSessions', activeSessions);

  // Format the status message
  const statusContent = [
    `--- STATUS UPDATE ---`,
    contextWindow !== undefined
      ? `Token Usage: ${formatNumber(totalTokens)}/${formatNumber(contextWindow)} (${usagePercentage}%)`
      : '',
    `Cost So Far: ${tokenTracker.getTotalCost()}`,
    ``,
    `Active Sub-Agents: ${activeAgents.length}`,
    ...activeAgents.map((a) => `- ${a.agentId}: ${a.goal}`),
    ``,
    `Active Shell Processes: ${activeShells.length}`,
    ...activeShells.map((s) => `- ${s.shellId}: ${s.metadata.command}`),
    ``,
    `Active Browser Sessions: ${activeSessions.length}`,
    ...activeSessions.map((s) => `- ${s.sessionId}: ${s.metadata.url ?? ''}`),
    ``,
    usagePercentage !== undefined &&
      (usagePercentage >= 50
        ? `Your token usage is high (${usagePercentage}%). It is recommended to use the 'compactHistory' tool now to reduce context size.`
        : `If token usage gets high (>50%), consider using the 'compactHistory' tool to reduce context size.`),
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
