# Tool Agent Module

This directory contains the Tool Agent implementation, split into smaller, focused modules for improved maintainability and testability.

## Module Structure

- **index.ts**: Re-exports from toolAgentCore.ts and other modules
- **toolAgentCore.ts**: Main implementation of the tool agent functionality
- **config.ts**: Configuration-related code and default settings
- **messageUtils.ts**: Utilities for handling and formatting messages
- **toolExecutor.ts**: Logic for executing tool calls
- **tokenTracking.ts**: Enhanced utilities for token tracking
- **types.ts**: Additional type definitions specific to toolAgent (re-exports from core/types.ts)

## Usage

```typescript
import { toolAgent } from '../../core/toolAgent/index.js';
import { Tool, ToolContext } from '../../core/types.js';

// Use the toolAgent function
const result = await toolAgent(prompt, tools, config, context);
```

## Benefits of This Structure

- **Improved maintainability**: Smaller, focused files are easier to understand and modify
- **Better testability**: Isolated components can be tested independently
- **Clearer responsibilities**: Each module has a single purpose
- **Easier onboarding**: New developers can understand the system more quickly
- **Simpler future extensions**: Modular design makes it easier to extend functionality
