import { McpConfig } from '../core/mcp/index.js';
import { Tool } from '../core/types.js';

// Import tools
import { agentDoneTool } from './agent/agentDone.js';
import { agentMessageTool } from './agent/agentMessage.js';
import { agentStartTool } from './agent/agentStart.js';
import { listAgentsTool } from './agent/listAgents.js';
import { fetchTool } from './fetch/fetch.js';
import { userMessageTool } from './interaction/userMessage.js';
import { userPromptTool } from './interaction/userPrompt.js';
import { createMcpTool } from './mcp.js';
import { listSessionsTool } from './session/listSessions.js';
import { sessionMessageTool } from './session/sessionMessage.js';
import { sessionStartTool } from './session/sessionStart.js';
import { listShellsTool } from './shell/listShells.js';
import { shellMessageTool } from './shell/shellMessage.js';
import { shellStartTool } from './shell/shellStart.js';
import { waitTool } from './sleep/wait.js';
import { textEditorTool } from './textEditor/textEditor.js';

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

    //agentExecuteTool as unknown as Tool,
    agentStartTool as unknown as Tool,
    agentMessageTool as unknown as Tool,
    listAgentsTool as unknown as Tool,
    agentDoneTool as unknown as Tool,

    fetchTool as unknown as Tool,

    shellStartTool as unknown as Tool,
    shellMessageTool as unknown as Tool,
    listShellsTool as unknown as Tool,

    sessionStartTool as unknown as Tool,
    sessionMessageTool as unknown as Tool,
    listSessionsTool as unknown as Tool,

    waitTool as unknown as Tool,
  ];

  // Only include user interaction tools if enabled
  if (userPrompt) {
    tools.push(userPromptTool as unknown as Tool);
    tools.push(userMessageTool as unknown as Tool);
  }

  // Add MCP tool if we have any servers configured
  if (mcpConfig.servers && mcpConfig.servers.length > 0) {
    const mcpTool = createMcpTool(mcpConfig);
    tools.push(mcpTool);
  }

  return tools;
}
