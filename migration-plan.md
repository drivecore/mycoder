# Migration Plan: Yargs to Citty

## Overview

This document outlines the plan to migrate the CLI package from yargs to citty. Citty is a modern, lightweight CLI builder that offers several advantages over yargs, including better TypeScript support, a more elegant API, and a more modular approach.

## Current Implementation Analysis

### CLI Structure

The current CLI implementation uses yargs with the following components:

- `index.ts`: Main entry point that sets up yargs and registers commands
- `commands/*.ts`: Individual command implementations
- `options.ts`: Shared options definition
- Custom command loading from config

### Command Pattern

Commands are implemented as yargs command modules with:

- `command`: Command definition string
- `describe`: Command description
- `builder`: Function to define command-specific options
- `handler`: Function to execute the command

### Shared Options

Shared options are defined in `options.ts` and used across commands.

## Citty Implementation Plan

### 1. Dependencies Update

- Add citty as a dependency
- Keep yargs temporarily during the migration

### 2. Command Structure Refactoring

- Create a new directory structure for citty commands
- Implement the main command definition using citty's `defineCommand`
- Implement subcommands using citty's nested command structure

### 3. Migration Steps

#### Step 1: Create Base Command Structure

```typescript
// src/cli.ts
import { defineCommand, runMain } from 'citty';
import { sharedArgs } from './args';

const main = defineCommand({
  meta: {
    name: 'mycoder',
    version: '1.3.1',
    description:
      'A command line tool using agent that can do arbitrary tasks, including coding tasks',
  },
  args: sharedArgs,
  subCommands: {
    // Will be populated with commands
  },
});

export default main;
```

#### Step 2: Convert Shared Options

```typescript
// src/args.ts
import type { CommandArgs } from 'citty';

export const sharedArgs: CommandArgs = {
  logLevel: {
    type: 'string',
    description: 'Set minimum logging level',
    options: ['debug', 'verbose', 'info', 'warn', 'error'],
  },
  profile: {
    type: 'boolean',
    description: 'Enable performance profiling of CLI startup',
  },
  provider: {
    type: 'string',
    description: 'AI model provider to use',
    options: ['anthropic', 'ollama', 'openai'],
  },
  model: {
    type: 'string',
    description: 'AI model name to use',
  },
  maxTokens: {
    type: 'number',
    description: 'Maximum number of tokens to generate',
  },
  temperature: {
    type: 'number',
    description: 'Temperature for text generation (0.0-1.0)',
  },
  interactive: {
    type: 'boolean',
    alias: 'i',
    description: 'Run in interactive mode, asking for prompts',
    default: false,
  },
  file: {
    type: 'string',
    alias: 'f',
    description: 'Read prompt from a file',
  },
  tokenUsage: {
    type: 'boolean',
    description: 'Output token usage at info log level',
  },
  headless: {
    type: 'boolean',
    description: 'Use browser in headless mode with no UI showing',
  },
  userSession: {
    type: 'boolean',
    description:
      "Use user's existing browser session instead of sandboxed session",
  },
  pageFilter: {
    type: 'string',
    description: 'Method to process webpage content',
    options: ['simple', 'none', 'readability'],
  },
  tokenCache: {
    type: 'boolean',
    description: 'Enable token caching for LLM API calls',
  },
  userPrompt: {
    type: 'boolean',
    description: 'Alias for userPrompt: enable or disable the userPrompt tool',
  },
  githubMode: {
    type: 'boolean',
    description:
      'Enable GitHub mode for working with issues and PRs (requires git and gh CLI tools)',
    default: true,
  },
  upgradeCheck: {
    type: 'boolean',
    description: 'Disable version upgrade check (for automated/remote usage)',
  },
  ollamaBaseUrl: {
    type: 'string',
    description: 'Base URL for Ollama API (default: http://localhost:11434)',
  },
};
```

#### Step 3: Convert Default Command

```typescript
// src/commands/default.ts
import { defineCommand } from 'citty';
import { sharedArgs } from '../args';
import { executePrompt } from '../utils/execute-prompt';
import { loadConfig, getConfigFromArgv } from '../settings/config';
import * as fs from 'fs/promises';
import { userPrompt } from 'mycoder-agent';

export const defaultCommand = defineCommand({
  meta: {
    name: 'default',
    description: 'Execute a prompt or start interactive mode',
  },
  args: {
    ...sharedArgs,
    prompt: {
      type: 'positional',
      description: 'The prompt to execute',
    },
  },
  async run({ args }) {
    // Get configuration for model provider and name
    const config = await loadConfig(getConfigFromArgv(args));

    let prompt: string | undefined;

    // If file is specified, read from file
    if (args.file) {
      prompt = await fs.readFile(args.file, 'utf-8');
    }

    // If interactive mode
    if (args.interactive) {
      prompt = await userPrompt(
        "Type your request below or 'help' for usage information. Use Ctrl+C to exit.",
      );
    } else if (!prompt) {
      // Use command line prompt if provided
      prompt = args.prompt;
    }

    if (!prompt) {
      throw new Error(
        'No prompt provided. Either specify a prompt, use --file, or run in --interactive mode.',
      );
    }

    // Execute the prompt
    await executePrompt(prompt, config);
  },
});
```

#### Step 4: Convert Other Commands

Convert each command in the `commands/` directory to use citty's `defineCommand` function.

#### Step 5: Implement Custom Command Loading

```typescript
// src/commands/custom.ts
import { defineCommand, CommandDef } from 'citty';
import { loadConfig } from '../settings/config';
import { executePrompt } from '../utils/execute-prompt';

export async function getCustomCommands(): Promise<Record<string, CommandDef>> {
  const config = await loadConfig();

  if (!config.commands) {
    return {};
  }

  const commands: Record<string, CommandDef> = {};

  for (const [name, commandConfig] of Object.entries(config.commands)) {
    const args: Record<string, any> = {};

    // Convert args to citty format
    (commandConfig.args || []).forEach((arg) => {
      args[arg.name] = {
        type: 'string',
        description: arg.description,
        default: arg.default,
        required: arg.required,
      };
    });

    commands[name] = defineCommand({
      meta: {
        name,
        description: commandConfig.description || `Custom command: ${name}`,
      },
      args,
      async run({ args }) {
        // Load config
        const config = await loadConfig();

        // Execute the command
        const prompt = await commandConfig.execute(args);

        // Execute the prompt using the default command handler
        await executePrompt(prompt, config);
      },
    });
  }

  return commands;
}
```

#### Step 6: Update Entry Point

```typescript
// src/index.ts
import { runMain } from 'citty';
import main from './cli';

// Start the CLI
runMain(main);
```

#### Step 7: Update bin/cli.js

```javascript
#!/usr/bin/env node
import '../dist/index.js';
```

### 4. Testing Strategy

- Implement unit tests for each converted command
- Test command execution with various arguments
- Test help output and argument parsing
- Test custom command loading

### 5. Incremental Migration Approach

1. Implement citty commands alongside existing yargs commands
2. Add a feature flag to switch between implementations
3. Test thoroughly with both implementations
4. Switch to citty implementation by default
5. Remove yargs implementation when stable

## Benefits of Migration

- Better TypeScript support and type safety
- More modular and composable command structure
- Improved performance due to lighter dependencies
- Better maintainability with modern API design
- Enhanced developer experience

## Potential Challenges

- Ensuring backward compatibility for all command options
- Handling custom command loading logic
- Managing the transition period with both implementations
