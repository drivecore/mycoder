---
title: MyCoder - AI-Powered Coding Assistant
shortTitle: MyCoder
date: 2025-03-05
author: MyCoder Team
excerpt: Learn about MyCoder, an intelligent AI coding assistant that helps you accomplish coding tasks through natural language commands.
topics: ai, programming, development, tools
readTimeMinutes: 7
---

# MyCoder

MyCoder is an AI-powered coding assistant that helps you accomplish a wide range of coding tasks through natural language commands. It's designed to understand your project context, implement features, fix bugs, and transform code based on your instructions.

## What is MyCoder?

MyCoder is a command-line tool that uses AI to help you with software development tasks. By understanding your project's structure and requirements, MyCoder can autonomously execute complex coding tasks that would typically require significant manual effort.

Currently available as a research preview, MyCoder is built to work alongside developers, enhancing productivity while maintaining full control over the development process.

## Key Features

- **AI-Powered**: Supports multiple AI providers including Anthropic, OpenAI, Mistral AI, xAI/Grok, and Ollama
- **Extensible Tool System**: Includes tools for file operations, shell commands, web browsing, and more
- **Parallel Execution**: Can spawn sub-agents to work on different parts of a task simultaneously
- **Self-Modification**: Capable of modifying code, including its own codebase
- **Smart Logging**: Hierarchical, color-coded logging for clear visibility into actions
- **Human-Compatible**: Works with standard project structures without special formatting
- **Configuration System**: Persistent configuration options to customize behavior
- **GitHub Integration**: Optional GitHub mode for working with issues and PRs
- **Custom Prompts**: Ability to customize the system prompt for specialized behavior

## Getting Started

### Prerequisites

- OS: MacOS, Windows, or Linux
- Node.js >= 20.0.0
- An API key for your chosen AI provider

### Installation

```bash
# Install globally
npm install -g mycoder

# Or use with npx
npx mycoder
```

For detailed installation instructions for macOS and Linux, including how to set up Node.js using NVM, [see our installation guide](installation.md).

### Supported AI Providers

MyCoder supports multiple AI providers:

| Provider   | Environment Variable | Models                               |
| ---------- | -------------------- | ------------------------------------ |
| Anthropic  | `ANTHROPIC_API_KEY`  | claude-3-opus, claude-3-sonnet, etc. |
| OpenAI     | `OPENAI_API_KEY`     | gpt-4o, o3-mini, etc.                |
| Mistral AI | `MISTRAL_API_KEY`    | mistral-large, mistral-medium, etc.  |
| xAI/Grok   | `XAI_API_KEY`        | grok-1                               |
| Ollama     | N/A (local)          | Various local models                 |

You can specify which provider and model to use with the `--modelProvider` and `--modelName` options:

```bash
mycoder --modelProvider openai --modelName gpt-4o "Your prompt here"
```

Or set them as defaults in your configuration:

```bash
mycoder config set modelProvider openai
mycoder config set modelName gpt-4o
```

### Setting Up Your API Key

Before using MyCoder with a specific provider, you need to provide the appropriate API key:

1. Set an environment variable:

   ```bash
   export ANTHROPIC_API_KEY=your-api-key
   # or
   export OPENAI_API_KEY=your-api-key
   # or
   export MISTRAL_API_KEY=your-api-key
   # or
   export XAI_API_KEY=your-api-key
   ```

2. Create a `.env` file in your working directory with the appropriate key:
   ```
   ANTHROPIC_API_KEY=your-api-key
   ```

You can obtain API keys from the respective provider websites.

## Basic Usage

### Running with a Prompt

The simplest way to use MyCoder is to provide a natural language prompt:

```bash
mycoder "Fix all TypeScript build errors and ensure tests pass"
```

### Interactive Mode

You can run MyCoder in interactive mode for ongoing conversation:

```bash
mycoder -i
```

### Reading Prompts from Files

For complex tasks, you can prepare your prompt in a file:

```bash
mycoder --file=my-task-description.txt
```

### Performance Profiling

You can enable performance profiling to diagnose startup times and identify bottlenecks:

```bash
# Enable profiling for any command
mycoder --profile "Fix the build errors"

# Or use with other commands
mycoder --profile --interactive
```

The profiling output shows detailed timing information for each initialization step:

```
📊 Performance Profile:
=======================
Module initialization: 10.12ms (10.12ms)
After imports: 150.34ms (140.22ms)
Main function start: 269.99ms (119.65ms)
After dotenv config: 270.10ms (0.11ms)
After Sentry init: 297.57ms (27.48ms)
Before package.json load: 297.57ms (0.00ms)
After package.json load: 297.78ms (0.21ms)
Before yargs setup: 297.78ms (0.00ms)
After yargs setup: 401.45ms (103.67ms)
Total startup time: 401.45ms
=======================
```

This is particularly useful for diagnosing performance differences between operating systems.

## Command Line Options

| Option              | Description                                                                       |
| ------------------- | --------------------------------------------------------------------------------- |
| `[prompt]`          | Main prompt text (positional argument)                                            |
| `-i, --interactive` | Run in interactive mode, asking for prompts                                       |
| `-f, --file`        | Read prompt from a specified file                                                 |
| `-l, --logLevel`    | Set minimum logging level (debug, verbose, info, warn, error)                     |
| `--tokenUsage`      | Output token usage at info log level                                              |
| `--headless`        | Use browser in headless mode with no UI showing (default: true)                   |
| `--userSession`     | Use user's existing browser session instead of sandboxed session (default: false) |
| `--pageFilter`      | Method to process webpage content (simple, none, readability)                     |
| `--profile`         | Enable performance profiling of CLI startup                                       |
| `--modelProvider`   | Specify the AI model provider to use (anthropic, openai, mistral, xai, ollama)    |
| `--modelName`       | Specify the model name to use with the selected provider                          |
| `-h, --help`        | Show help                                                                         |
| `-V, --version`     | Show version number                                                               |

## Configuration Management

MyCoder provides a configuration system that allows you to set default values for various options. This saves you from having to specify the same options repeatedly on the command line.

### Configuration Commands

| Command                            | Description                        |
| ---------------------------------- | ---------------------------------- |
| `mycoder config list`              | List all configuration values      |
| `mycoder config get [key]`         | Get a specific configuration value |
| `mycoder config set [key] [value]` | Set a configuration value          |

### Available Configuration Options

| Option          | Description                                        | Example                                                   |
| --------------- | -------------------------------------------------- | --------------------------------------------------------- |
| `logLevel`      | Default logging level                              | `mycoder config set logLevel verbose`                     |
| `tokenUsage`    | Show token usage by default                        | `mycoder config set tokenUsage true`                      |
| `headless`      | Use browser in headless mode                       | `mycoder config set headless false`                       |
| `userSession`   | Use existing browser session                       | `mycoder config set userSession true`                     |
| `pageFilter`    | Default webpage content processing method          | `mycoder config set pageFilter readability`               |
| `modelProvider` | Default AI model provider                          | `mycoder config set modelProvider openai`                 |
| `modelName`     | Default model name                                 | `mycoder config set modelName gpt-4o`                     |
| `customPrompt`  | Custom instructions to append to the system prompt | `mycoder config set customPrompt "Always use TypeScript"` |
| `githubMode`    | Enable GitHub integration mode                     | `mycoder config set githubMode true`                      |
| `profile`       | Enable performance profiling                       | `mycoder config set profile true`                         |

### Custom Prompt

The `customPrompt` configuration option allows you to append custom instructions to the system prompt used by MyCoder. This can be useful for guiding the AI's behavior for your specific use cases:

```bash
# Example: Set a custom prompt to prefer TypeScript
mycoder config set customPrompt "Always use TypeScript when writing code. Prefer functional programming patterns when possible."
```

The custom prompt will be included in both the main agent and any sub-agents that are created.

### GitHub Mode

MyCoder supports GitHub integration through the `githubMode` configuration option. When enabled, MyCoder will:

- Work with GitHub issues and PRs as part of its workflow
- Create branches for issues it's working on
- Make commits with descriptive messages
- Create PRs when work is complete

To enable GitHub mode:

```bash
mycoder config set githubMode true
```

This requires the GitHub CLI (`gh`) to be installed and authenticated. For more details, see the GitHub Mode documentation.

## Available Tools

MyCoder has access to a variety of tools that enable it to perform complex tasks:

| Tool                 | Description                                      | Use Case                                                         |
| -------------------- | ------------------------------------------------ | ---------------------------------------------------------------- |
| **textEditor**       | Views, creates, and edits files with persistence | Reading and modifying project files with advanced capabilities   |
| **shellStart**       | Executes shell commands                          | Running builds, tests, installations, git operations             |
| **shellMessage**     | Interacts with running shell processes           | Working with interactive CLIs, monitoring long-running processes |
| **fetch**            | Makes HTTP requests                              | Accessing APIs, downloading resources                            |
| **browseStart**      | Starts a browser session                         | Researching documentation, exploring solutions                   |
| **browseMessage**    | Performs actions in an active browser            | Navigating websites, extracting information                      |
| **subAgent**         | Creates specialized sub-agents                   | Handling complex tasks in parallel                               |
| **userPrompt**       | Requests input from the user                     | Getting clarification or confirmation                            |
| **respawn**          | Resets agent context                             | Starting fresh after completing a subtask                        |
| **sleep**            | Pauses execution                                 | Waiting for asynchronous processes to complete                   |
| **sequenceComplete** | Finalizes the agent's work                       | Returning final results and summaries                            |

## Example Use Cases

MyCoder can help with a wide range of development tasks:

### Code Migration & Updates

```bash
# Converting test frameworks
mycoder "Convert all Jest tests in the src/ directory to Vitest, updating any necessary configuration files and dependencies"

# Dependency updates
mycoder "Update all dependencies to their latest versions, handle any breaking changes, and ensure all tests pass"
```

### Code Refactoring

```bash
# Class refactoring
mycoder "Refactor the UserService class in src/services/UserService.ts to use the repository pattern, update all files that use this class, and ensure tests pass"

# API modernization
mycoder "Convert all callback-based functions in the project to use async/await, update tests accordingly"
```

### Feature Implementation

```bash
# CLI enhancement
mycoder "Add a new global --debug command line option that enables verbose logging throughout the application"

# New functionality
mycoder "Create a new caching system for API responses using Redis, including configuration options and unit tests"
```

### Maintenance & Fixes

```bash
# Build fixes
mycoder "Fix all TypeScript build errors and ensure all tests pass"

# Test coverage
mycoder "Add unit tests for all untested functions in the src/utils directory, aiming for 80% coverage"
```

### Documentation

```bash
# Documentation generation
mycoder "Generate comprehensive JSDoc documentation for all exported functions and update the API documentation in the docs/ directory"

# Architecture documentation
mycoder "Analyze the current codebase and create detailed architecture documentation including component diagrams and data flow"
```

## Best Practices

### Providing Context

MyCoder works best when it has clear context about your project:

1. Ensure your project has a descriptive README.md
2. Be specific about file paths in your prompts
3. Explain any non-standard patterns or conventions

### Task Complexity

For optimal results with complex tasks:

1. Start with smaller, well-defined tasks
2. Build up to more complex changes as you get comfortable
3. For major refactorings, consider a step-by-step approach

### Security Considerations

Since MyCoder can execute any command on your system:

1. Review the actions MyCoder proposes before confirming them
2. Use in trusted codebases and environments
3. Be cautious when allowing network access or third-party tool installation

## Limitations

As a research preview, MyCoder has some limitations:

1. **Context Window**: Limited by Claude's context window size, which may affect reasoning about very large codebases

2. **Language Model Limitations**: May occasionally produce hallucinations or misunderstandings

3. **Tool Constraints**: Some tools have built-in constraints (like file size limits) to prevent resource issues

4. **External Dependencies**: Requires an internet connection to access the Claude API

## Getting Help

If you encounter issues or have questions about MyCoder:

1. Join the [MyCoder Discord community](https://discord.gg/5K6TYrHGHt) for support
2. Check the [GitHub repository](https://github.com/bhouston/mycoder) for documentation and updates
3. Use the `--help` command line option for quick reference

---

**Warning**: MyCoder can execute any command on your system that you ask it to. It can delete files, install software, and send data to remote servers. By using this tool, you acknowledge that the authors and contributors are not responsible for any damage that may occur as a result of using this tool.
