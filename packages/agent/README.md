# MyCoder Agent

Core AI agent system that powers the MyCoder CLI tool. This package provides a modular tool-based architecture that allows AI agents to interact with files, execute commands, make network requests, spawn sub-agents for parallel task execution, and automate browser interactions.

## Overview

The MyCoder Agent system is built around these key concepts:

- 🛠️ **Extensible Tool System**: Modular architecture with various tool categories
- 🔄 **Parallel Execution**: Ability to spawn sub-agents for concurrent task processing
- 🔌 **Multi-LLM Support**: Works with Anthropic Claude, OpenAI GPT models, and Ollama
- 🌐 **Web Automation**: Built-in browser automation for web interactions
- 🔍 **Smart Logging**: Hierarchical, color-coded logging system for clear output
- 📝 **Advanced Text Editing**: Powerful file manipulation capabilities
- 🔄 **MCP Integration**: Support for the Model Context Protocol

Please join the MyCoder.ai discord for support: https://discord.gg/5K6TYrHGHt

## Installation

```bash
npm install mycoder-agent
```

## API Key Required

Before using MyCoder Agent, you must have one of the following API keys:

- **Anthropic**: Set `ANTHROPIC_API_KEY` as an environment variable or in a .env file (Get from https://www.anthropic.com/api)
- **OpenAI**: Set `OPENAI_API_KEY` as an environment variable or in a .env file
- **Ollama**: Use locally running Ollama instance

## Core Components

### Tool System

The tool system is the foundation of the MyCoder agent's capabilities:

- **Modular Design**: Each tool is a standalone module with clear inputs and outputs
- **Type Safety**: Tools use Zod for schema validation and TypeScript for type safety
- **Token Tracking**: Built-in token usage tracking to optimize API costs
- **Parallel Execution**: Tools can run concurrently for efficiency

### Agent System

The agent system orchestrates the execution flow:

- **Main Agent**: Primary agent that handles the overall task
- **Sub-Agents**: Specialized agents for parallel task execution
- **Agent State Management**: Tracking agent status and communication
- **LLM Integration**: Supports multiple LLM providers (Anthropic, OpenAI, Ollama)

### LLM Providers

The agent supports multiple LLM providers:

- **Anthropic**: Claude models with full tool use support
- **OpenAI**: GPT-4 and other OpenAI models with function calling
- **Ollama**: Local LLM support for privacy and offline use

### Model Context Protocol (MCP)

MyCoder Agent supports the Model Context Protocol:

- **Resource Loading**: Load context from MCP-compatible servers
- **Server Configuration**: Configure multiple MCP servers
- **Tool Integration**: Use MCP-provided tools

## Available Tools

### File & Text Manipulation
- **textEditor**: View, create, and edit files with persistent state
  - Commands: view, create, str_replace, insert, undo_edit
  - Line number support and partial file viewing

### System Interaction
- **shellStart**: Execute shell commands with sync/async modes
- **shellMessage**: Interact with running shell processes
- **shellExecute**: One-shot shell command execution
- **listShells**: List all running shell processes

### Agent Management
- **agentStart**: Create sub-agents for parallel tasks
- **agentMessage**: Send messages to sub-agents
- **agentDone**: Complete the current agent's execution
- **listAgents**: List all running agents

### Network & Web
- **fetch**: Make HTTP requests to APIs
- **sessionStart**: Start browser automation sessions
- **sessionMessage**: Control browser sessions (navigation, clicking, typing)
- **listSessions**: List all browser sessions

### Utility Tools
- **sleep**: Pause execution for a specified duration
- **userPrompt**: Request input from the user

## Project Structure

```
src/
├── core/               # Core agent and LLM abstraction
│   ├── llm/            # LLM providers and interfaces
│   │   └── providers/  # Anthropic, OpenAI, Ollama implementations
│   ├── mcp/            # Model Context Protocol integration
│   └── toolAgent/      # Tool agent implementation
├── tools/              # Tool implementations
│   ├── agent/          # Sub-agent tools
│   ├── fetch/          # HTTP request tools
│   ├── interaction/    # User interaction tools
│   ├── session/        # Browser automation tools
│   ├── shell/          # Shell execution tools
│   ├── sleep/          # Execution pause tool
│   └── textEditor/     # File manipulation tools
└── utils/              # Utility functions and logger
```

## Technical Requirements

- Node.js >= 18.0.0
- pnpm >= 10.2.1

## Browser Automation

The agent includes powerful browser automation capabilities using Playwright:

- **Web Navigation**: Visit websites and follow links
- **Content Extraction**: Extract and filter page content
- **Element Interaction**: Click buttons, fill forms, and interact with UI elements
- **Waiting Strategies**: Smart waiting for page loads and element visibility

## Usage Example

```typescript
import { toolAgent } from 'mycoder-agent';
import { textEditorTool } from 'mycoder-agent';
import { shellStartTool } from 'mycoder-agent';
import { Logger, LogLevel } from 'mycoder-agent';

// Create a logger
const logger = new Logger({ name: 'MyAgent', logLevel: LogLevel.info });

// Define available tools
const tools = [textEditorTool, shellStartTool];

// Run the agent
const result = await toolAgent(
  "Write a simple Node.js HTTP server and save it to server.js",
  tools,
  {
    getSystemPrompt: () => "You are a helpful coding assistant...",
    maxIterations: 10,
  },
  {
    logger,
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    apiKey: process.env.ANTHROPIC_API_KEY,
    workingDirectory: process.cwd(),
  }
);

console.log('Agent result:', result);
```

## Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](../CONTRIBUTING.md) for development workflow and guidelines.

## License

MIT