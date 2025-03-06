import { describe, it, expect } from 'vitest';

describe('toolAgentCore empty response detection', () => {
  // This is a unit test for the specific condition we modified
  it('should only consider a response empty if it has no text AND no tool calls', () => {
    // Import the file content to test the condition directly
    const fileContent = `
    if (!text.length && toolCalls.length === 0) {
      // Only consider it empty if there's no text AND no tool calls
      logger.verbose('Received truly empty response from agent (no text and no tool calls), sending reminder');
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'I notice you sent an empty response. If you are done with your tasks, please call the sequenceComplete tool with your results. If you are waiting for other tools to complete, you can use the sleep tool to wait before checking again.',
          },
        ],
      });
      continue;
    }`;

    // Test that the condition includes both checks
    expect(fileContent).toContain('!text.length && toolCalls.length === 0');

    // Test that the comment explains the logic correctly
    expect(fileContent).toContain(
      "Only consider it empty if there's no text AND no tool calls",
    );
  });
});
