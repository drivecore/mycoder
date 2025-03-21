# Example Status Update

This is an example of what the status update looks like for the agent:

```
--- STATUS UPDATE ---
Token Usage: 45,235/100,000 (45%)
Cost So Far: $0.23

Active Sub-Agents: 2
- sa_12345: Analyzing project structure and dependencies
- sa_67890: Implementing unit tests for compactHistory tool

Active Shell Processes: 3
- sh_abcde: npm test -- --watch packages/agent/src/tools/utility
- sh_fghij: npm run watch
- sh_klmno: git status

Active Browser Sessions: 1
- bs_12345: https://www.typescriptlang.org/docs/handbook/utility-types.html

If token usage is high (>70%), consider using the 'compactHistory' tool to reduce context size.
--- END STATUS ---
```

## About Status Updates

Status updates are sent periodically to the agent (every 5 interactions) to provide awareness of:

1. **Token Usage**: Current usage and percentage of maximum context window
2. **Cost**: Estimated cost of the session so far
3. **Active Sub-Agents**: Running background agents and their tasks
4. **Active Shell Processes**: Running shell commands
5. **Active Browser Sessions**: Open browser sessions and their URLs

When token usage gets high (>70%), the agent is reminded to use the `compactHistory` tool to reduce context size by summarizing older messages.

## Using the compactHistory Tool

The agent can use the compactHistory tool like this:

```javascript
{
  name: "compactHistory",
  preserveRecentMessages: 10,
  customPrompt: "Optional custom summarization prompt"
}
```

This will summarize all but the 10 most recent messages into a single summary message, significantly reducing token usage while preserving important context.