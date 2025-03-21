# Message Compaction

When agents run for extended periods, they accumulate a large history of messages that eventually fills up the LLM's context window, causing errors when the token limit is exceeded. The message compaction feature helps prevent this by providing agents with awareness of their token usage and tools to manage their context window.

## Features

### 1. Token Usage Tracking

The LLM abstraction now tracks and returns:
- Total tokens used in the current completion request
- Maximum allowed tokens for the model/provider

This information is used to monitor context window usage and trigger appropriate actions.

### 2. Status Updates

Agents receive status updates with information about:
- Current token usage and percentage of the maximum
- Cost so far
- Active sub-agents and their status
- Active shell processes and their status
- Active browser sessions and their status

Status updates are sent:
1. Every 5 agent interactions (periodic updates)
2. Whenever token usage exceeds 50% of the maximum (threshold-based updates)

Example status update:
```
--- STATUS UPDATE ---
Token Usage: 45,235/100,000 (45%)
Cost So Far: $0.23

Active Sub-Agents: 2
- sa_12345: Analyzing project structure and dependencies
- sa_67890: Implementing unit tests for compactHistory tool

Active Shell Processes: 3
- sh_abcde: npm test
- sh_fghij: npm run watch
- sh_klmno: git status

Active Browser Sessions: 1
- bs_12345: https://www.typescriptlang.org/docs/handbook/utility-types.html

If token usage is high (>70%), consider using the 'compactHistory' tool to reduce context size.
--- END STATUS ---
```

### 3. Message Compaction Tool

The `compactHistory` tool allows agents to compact their message history by summarizing older messages while preserving recent context. This tool:

1. Takes a parameter for how many recent messages to preserve unchanged
2. Summarizes all older messages into a single, concise summary
3. Replaces the original messages with the summary and preserved messages
4. Reports on the reduction in context size

## Usage

Agents are instructed to monitor their token usage through status updates and use the `compactHistory` tool when token usage approaches 50% of the maximum:

```javascript
// Example of agent using the compactHistory tool
{
  name: "compactHistory",
  preserveRecentMessages: 10,
  customPrompt: "Focus on summarizing our key decisions and current tasks."
}
```

## Configuration

The message compaction feature is enabled by default with reasonable defaults:
- Status updates every 5 agent interactions
- Recommendation to compact at 70% token usage
- Default preservation of 10 recent messages when compacting

## Model Token Limits

The system includes token limits for various models:

### Anthropic Models
- claude-3-opus-20240229: 200,000 tokens
- claude-3-sonnet-20240229: 200,000 tokens
- claude-3-haiku-20240307: 200,000 tokens
- claude-2.1: 100,000 tokens

### OpenAI Models
- gpt-4o: 128,000 tokens
- gpt-4-turbo: 128,000 tokens
- gpt-3.5-turbo: 16,385 tokens

### Ollama Models
- llama2: 4,096 tokens
- mistral: 8,192 tokens
- mixtral: 32,768 tokens

## Benefits

- Prevents context window overflow errors
- Maintains important context for agent operation
- Enables longer-running agent sessions
- Makes the system more robust for complex tasks
- Gives agents self-awareness of resource usage