---
sidebar_position: 9
---

# Sub-Agent Workflow Modes

MyCoder supports different modes for working with sub-agents, giving you flexibility in how tasks are distributed and executed. You can configure the sub-agent workflow mode based on your specific needs and resource constraints.

## Available Modes

MyCoder supports three distinct sub-agent workflow modes:

### 1. Disabled Mode

In this mode, sub-agent functionality is completely disabled:

- No sub-agent tools are available to the main agent
- All tasks must be handled by the main agent directly
- Useful for simpler tasks or when resource constraints are a concern
- Reduces memory usage and API costs for straightforward tasks

### 2. Synchronous Mode ("sync")

In synchronous mode, the parent agent waits for sub-agents to complete before continuing:

- Uses the `agentExecute` tool for synchronous execution
- Parent agent waits for sub-agent completion before continuing its own workflow
- Useful for tasks that require sequential execution
- Simpler to reason about as there's no parallel execution
- Good for tasks where later steps depend on the results of earlier steps

### 3. Asynchronous Mode ("async") - Default

In asynchronous mode, sub-agents run in parallel with the parent agent:

- Uses `agentStart`, `agentMessage`, and `listAgents` tools
- Sub-agents run in the background while the parent agent continues its work
- Parent agent can check status and provide guidance to sub-agents
- Useful for complex tasks that can benefit from parallelization
- More efficient for tasks that can be executed concurrently
- Allows the parent agent to coordinate multiple sub-agents

## Configuration

You can set the sub-agent workflow mode in your `mycoder.config.js` file:

```javascript
// mycoder.config.js
export default {
  // Sub-agent workflow mode: 'disabled', 'sync', or 'async'
  subAgentMode: 'async', // Default value
  
  // Other configuration options...
};
```

You can also specify the mode via the command line:

```bash
mycoder --subAgentMode disabled "Implement a simple React component"
```

## Choosing the Right Mode

Consider these factors when choosing a sub-agent workflow mode:

- **Task Complexity**: For complex tasks that can be broken down into independent parts, async mode is often best. For simpler tasks, disabled mode may be sufficient.

- **Resource Constraints**: Disabled mode uses fewer resources. Async mode can use more memory and API tokens but may complete complex tasks faster.

- **Task Dependencies**: If later steps depend heavily on the results of earlier steps, sync mode ensures proper sequencing.

- **Coordination Needs**: If you need to coordinate multiple parallel workflows, async mode gives you more control.

## Example: Using Different Modes

### Disabled Mode

Best for simple, focused tasks:

```javascript
// mycoder.config.js
export default {
  subAgentMode: 'disabled',
  // Other settings...
};
```

### Synchronous Mode

Good for sequential, dependent tasks:

```javascript
// mycoder.config.js
export default {
  subAgentMode: 'sync',
  // Other settings...
};
```

### Asynchronous Mode

Ideal for complex projects with independent components:

```javascript
// mycoder.config.js
export default {
  subAgentMode: 'async', // This is the default
  // Other settings...
};
```

## How It Works Internally

- In **disabled mode**, no agent tools are added to the available tools list.
- In **sync mode**, only the `agentExecute` and `agentDone` tools are available, ensuring synchronous execution.
- In **async mode**, the full suite of agent tools (`agentStart`, `agentMessage`, `listAgents`, and `agentDone`) is available, enabling parallel execution.

This implementation allows MyCoder to adapt to different task requirements while maintaining a consistent interface for users.