refactor(agent): implement parallel resource cleanup

This change improves the resource cleanup process by handling browser sessions,
shell processes, and sub-agents in parallel rather than sequentially.

The implementation:
1. Refactors the cleanup method into smaller helper methods for each resource type
2. Uses Promise.all to execute cleanup operations concurrently
3. Filters tools by status during the initial grouping to simplify the code

This approach significantly speeds up the cleanup process, especially when
dealing with multiple resources of different types.