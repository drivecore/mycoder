import { McpConfig } from '../core/mcp/index.js';
import { Tool } from '../core/types.js';

// Import tools
import { browseMessageTool } from './browser/browseMessage.js';
import { browseStartTool } from './browser/browseStart.js';
import { subAgentTool } from './interaction/subAgent.js';
import { userPromptTool } from './interaction/userPrompt.js';
import { fetchTool } from './io/fetch.js';
import { textEditorTool } from './io/textEditor.js';
import { createMcpTool } from './mcp.js';
import { listAgentsTool } from './system/listAgents.js';
import { listBackgroundToolsTool } from './system/listBackgroundTools.js';
import { sequenceCompleteTool } from './system/sequenceComplete.js';
import { shellMessageTool } from './system/shellMessage.js';
import { shellStartTool } from './system/shellStart.js';
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
    subAgentTool as unknown as Tool,
    /*agentStartTool as unknown as Tool,
    agentMessageTool as unknown as Tool,*/
    sequenceCompleteTool as unknown as Tool,
    fetchTool as unknown as Tool,
    shellStartTool as unknown as Tool,
    shellMessageTool as unknown as Tool,
    browseStartTool as unknown as Tool,
    browseMessageTool as unknown as Tool,
    //respawnTool as unknown as Tool,  this is a confusing tool for now.
    sleepTool as unknown as Tool,
    listBackgroundToolsTool as unknown as Tool,
    listAgentsTool as unknown as Tool,
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
