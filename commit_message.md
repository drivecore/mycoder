feat(agent): implement incremental resource cleanup for agent lifecycle

This commit adds a new cleanup method to the BackgroundTools class that handles
cleaning up browser sessions, shell processes, and sub-agents associated with an
agent when it completes its task, encounters an error, or is terminated.

The changes include:

- Adding a cleanup method to BackgroundTools that cleans up resources
- Calling cleanup when agents complete successfully
- Calling cleanup when agents encounter errors
- Calling cleanup when agents are terminated
- Enhancing global cleanup to first attempt to clean up any still-running agents
- Adding tests for the new cleanup functionality

Fixes #236
