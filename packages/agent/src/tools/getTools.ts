import { McpConfig } from '../core/mcp/index.js';
import { Tool } from '../core/types.js';

// Import tools
import { agentCompleteTool } from './agent/agentComplete.js';
import { agentExecuteTool } from './agent/agentExecute.js';
import { sessionMessageTool } from './browser/sessionMessage.js';
import { sessionStartTool } from './browser/sessionStart.js';
import { userPromptTool } from './interaction/userPrompt.js';
import { fetchTool } from './io/fetch.js';
import { textEditorTool } from './io/textEditor.js';
import { createMcpTool } from './mcp.js';
import { listShellsTool } from './shell/listShells.js';
import { shellMessageTool } from './shell/shellMessage.js';
import { shellStartTool } from './shell/shellStart.js';
import { listBackgroundToolsTool } from './system/listBackgroundTools.js';
import { sleepTool } from './system/sleep.js';

// Import these separately to avoid circular dependencies

interface GetToolsOptions {
  userPrompt?: boolean;
  mcpConfig?: McpConfig;
}

export function getTools(options?: GetToolsOptions): Tool[] {
  const userPrompt = options?.userPrompt !== false; // Default to true if not specified
  const mcpConfig = options?.mcpConfig || { servers: [], defaultResources: [] };

  // Force cast to Tool type to avoid TypeScript issues
  const tools: Tool[] = [
    textEditorTool as unknown as Tool,
    agentExecuteTool as unknown as Tool,
    /*agentStartTool as unknown as Tool,
    agentMessageTool as unknown as Tool,*/
    agentCompleteTool as unknown as Tool,
    fetchTool as unknown as Tool,
    shellStartTool as unknown as Tool,
    shellMessageTool as unknown as Tool,
    sessionStartTool as unknown as Tool,
    sessionMessageTool as unknown as Tool,
    //respawnTool as unknown as Tool,  this is a confusing tool for now.
    sleepTool as unknown as Tool,
    listBackgroundToolsTool as unknown as Tool,
    listShellsTool as unknown as Tool,
  ];

  // Only include userPrompt tool if enabled
  if (userPrompt) {
    tools.push(userPromptTool as unknown as Tool);
  }

  // Add MCP tool if we have any servers configured
  if (mcpConfig.servers && mcpConfig.servers.length > 0) {
    const mcpTool = createMcpTool(mcpConfig);
    tools.push(mcpTool);
  }

  return tools;
}
