import { Tool } from '../core/types.js';

// Import tools
import { browseMessageTool } from './browser/browseMessage.js';
import { browseStartTool } from './browser/browseStart.js';
import { subAgentTool } from './interaction/subAgent.js';
import { userPromptTool } from './interaction/userPrompt.js';
import { fetchTool } from './io/fetch.js';
import { textEditorTool } from './io/textEditor.js';
import { respawnTool } from './system/respawn.js';
import { sequenceCompleteTool } from './system/sequenceComplete.js';
import { shellMessageTool } from './system/shellMessage.js';
import { shellStartTool } from './system/shellStart.js';
import { sleepTool } from './system/sleep.js';

// Import these separately to avoid circular dependencies

interface GetToolsOptions {
  enableUserPrompt?: boolean;
}

export function getTools(options?: GetToolsOptions): Tool[] {
  const enableUserPrompt = options?.enableUserPrompt !== false; // Default to true if not specified

  // Force cast to Tool type to avoid TypeScript issues
  const tools: Tool[] = [
    textEditorTool as unknown as Tool,
    subAgentTool as unknown as Tool,
    sequenceCompleteTool as unknown as Tool,
    fetchTool as unknown as Tool,
    shellStartTool as unknown as Tool,
    shellMessageTool as unknown as Tool,
    browseStartTool as unknown as Tool,
    browseMessageTool as unknown as Tool,
    respawnTool as unknown as Tool,
    sleepTool as unknown as Tool,
  ];

  // Only include userPrompt tool if enabled
  if (enableUserPrompt) {
    tools.push(userPromptTool as unknown as Tool);
  }

  return tools;
}
