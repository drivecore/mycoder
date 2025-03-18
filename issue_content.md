## Add Interactive Correction Feature to CLI Mode

### Description
Add a feature to the CLI mode that allows users to send corrections to the main agent while it's running, similar to how sub-agents can receive messages via the `agentMessage` tool. This would enable users to provide additional context, corrections, or guidance to the main agent without restarting the entire process.

### Requirements
- Implement a key command that pauses the output and triggers a user prompt
- Allow the user to type a correction message
- Send the correction to the main agent using a mechanism similar to `agentMessage`
- Resume normal operation after the correction is sent
- Ensure the correction is integrated into the agent's context

### Implementation Considerations
- Reuse the existing `agentMessage` functionality
- Add a new tool for the main agent to receive messages from the user
- Modify the CLI to capture key commands during execution
- Handle the pausing and resuming of output during message entry
- Ensure the correction is properly formatted and sent to the agent

### Why this is valuable
This feature will make the tool more interactive and efficient, allowing users to steer the agent in the right direction without restarting when they notice the agent is going off track or needs additional information.