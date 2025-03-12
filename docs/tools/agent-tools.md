# Agent Tools

The agent tools provide ways to create and interact with sub-agents. There are two approaches available:

1. The original `subAgent` tool (synchronous, blocking)
2. The new `agentStart` and `agentMessage` tools (asynchronous, non-blocking)

## subAgent Tool

The `subAgent` tool creates a sub-agent that runs synchronously until completion. The parent agent waits for the sub-agent to complete before continuing.

```typescript
subAgent({
  description: "A brief description of the sub-agent's purpose",
  goal: "The main objective that the sub-agent needs to achieve",
  projectContext: "Context about the problem or environment",
  workingDirectory: "/path/to/working/directory", // optional
  relevantFilesDirectories: "src/**/*.ts", // optional
});
```

## agentStart and agentMessage Tools

The `agentStart` and `agentMessage` tools provide an asynchronous approach to working with sub-agents. This allows the parent agent to:

- Start multiple sub-agents in parallel
- Monitor sub-agent progress
- Provide guidance to sub-agents
- Terminate sub-agents if needed

### agentStart

The `agentStart` tool creates a sub-agent and immediately returns an instance ID. The sub-agent runs asynchronously in the background.

```typescript
const { instanceId } = agentStart({
  description: "A brief description of the sub-agent's purpose",
  goal: "The main objective that the sub-agent needs to achieve",
  projectContext: "Context about the problem or environment",
  workingDirectory: "/path/to/working/directory", // optional
  relevantFilesDirectories: "src/**/*.ts", // optional
  enableUserPrompt: false, // optional, default: false
});
```

### agentMessage

The `agentMessage` tool allows interaction with a running sub-agent. It can be used to check the agent's progress, provide guidance, or terminate the agent.

```typescript
// Check agent progress
const { output, completed } = agentMessage({
  instanceId: "agent-instance-id",
  description: "Checking agent progress",
});

// Provide guidance (note: guidance implementation is limited in the current version)
agentMessage({
  instanceId: "agent-instance-id",
  guidance: "Focus on the task at hand and avoid unnecessary exploration",
  description: "Providing guidance to the agent",
});

// Terminate the agent
agentMessage({
  instanceId: "agent-instance-id",
  terminate: true,
  description: "Terminating the agent",
});
```

## Example: Using agentStart and agentMessage to run multiple sub-agents in parallel

```typescript
// Start multiple sub-agents
const agent1 = agentStart({
  description: "Agent 1",
  goal: "Implement feature A",
  projectContext: "Project X",
});

const agent2 = agentStart({
  description: "Agent 2",
  goal: "Implement feature B",
  projectContext: "Project X",
});

// Check progress of both agents
let agent1Completed = false;
let agent2Completed = false;

while (!agent1Completed || !agent2Completed) {
  if (!agent1Completed) {
    const result1 = agentMessage({
      instanceId: agent1.instanceId,
      description: "Checking Agent 1 progress",
    });
    agent1Completed = result1.completed;
    
    if (agent1Completed) {
      console.log("Agent 1 completed with result:", result1.output);
    }
  }
  
  if (!agent2Completed) {
    const result2 = agentMessage({
      instanceId: agent2.instanceId,
      description: "Checking Agent 2 progress",
    });
    agent2Completed = result2.completed;
    
    if (agent2Completed) {
      console.log("Agent 2 completed with result:", result2.output);
    }
  }
  
  // Wait before checking again
  if (!agent1Completed || !agent2Completed) {
    sleep({ seconds: 5 });
  }
}
```

## Choosing Between Approaches

- Use `subAgent` for simpler tasks where blocking execution is acceptable
- Use `agentStart` and `agentMessage` for:
  - Parallel execution of multiple sub-agents
  - Tasks where you need to monitor progress
  - Situations where you may need to provide guidance or terminate early