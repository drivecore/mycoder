# MyCoder CLI

Command-line interface for AI-powered coding tasks.

## Features

- 🤖 **AI-Powered**: Leverages Anthropic's Claude, OpenAI models, and Ollama for intelligent coding assistance
- 🛠️ **Extensible Tool System**: Modular architecture with various tool categories
- 🔄 **Parallel Execution**: Ability to spawn sub-agents for concurrent task processing
- 📝 **Self-Modification**: Can modify code, it was built and tested by writing itself
- 🔍 **Smart Logging**: Hierarchical, color-coded logging system for clear output
- 👤 **Human Compatible**: Uses README.md, project files and shell commands to build its own context
- 🌐 **GitHub Integration**: GitHub mode for working with issues and PRs as part of workflow

## Installation

```bash
npm install -g mycoder
```

## Usage

```bash
# Interactive mode
mycoder -i

# Run with a prompt
mycoder "Implement a React component that displays a list of items"

# Run with a prompt from a file
mycoder -f prompt.txt

# Enable GitHub mode
mycoder config set githubMode true
```

## GitHub Mode

MyCoder includes a GitHub mode that enables the agent to work with GitHub issues and PRs as part of its workflow. When enabled, the agent will:

- Start from existing GitHub issues or create new ones for tasks
- Create branches for issues it's working on
- Make commits with descriptive messages
- Create PRs when work is complete
- Create additional GitHub issues for follow-up tasks or ideas

To enable GitHub mode:

```bash
mycoder config set githubMode true
```

To disable GitHub mode:

```bash
mycoder config set githubMode false
```

Requirements for GitHub mode:

- GitHub CLI (`gh`) needs to be installed and authenticated
- User needs to have appropriate GitHub permissions for the target repository

## Configuration

MyCoder stores configuration in `~/.mycoder/config.json`. You can manage configuration using the `config` command:

```bash
# List all configuration
mycoder config list

# Get a specific configuration value
mycoder config get githubMode

# Set a configuration value
mycoder config set githubMode true

# Configure model provider and model name
mycoder config set modelProvider openai
mycoder config set modelName gpt-4o-2024-05-13
```

### Model Selection

MyCoder supports Anthropic, OpenAI, and Ollama models. You can configure which model provider and model name to use with the following commands:

```bash
# Use OpenAI models
mycoder config set modelProvider openai
mycoder config set modelName gpt-4o-2024-05-13  # or any other OpenAI model

# Use Anthropic models
mycoder config set modelProvider anthropic
mycoder config set modelName claude-3-7-sonnet-20250219  # or any other Anthropic model

# Use Ollama models (local)
mycoder config set modelProvider ollama
mycoder config set modelName llama3-groq-tool-use  # or any other model available in your Ollama instance

# Configure custom Ollama server URL (default is http://localhost:11434/api)
mycoder config set ollamaBaseUrl http://your-ollama-server:11434/api
```

You can also specify the model provider and name directly when running a command:

```bash
mycoder --modelProvider openai --modelName gpt-4o-2024-05-13 "Your prompt here"
```

### Available Configuration Options

- `githubMode`: Enable GitHub mode for working with issues and PRs (default: `false`)
- `headless`: Run browser in headless mode with no UI showing (default: `true`)
- `userSession`: Use user's existing browser session instead of sandboxed session (default: `false`)
- `pageFilter`: Method to process webpage content: 'simple', 'none', or 'readability' (default: `none`)
- `ollamaBaseUrl`: Base URL for Ollama API (default: `http://localhost:11434/api`)

Example:

```bash
# Set browser to show UI
mycoder config set headless false

# Use existing browser session
mycoder config set userSession true

# Use readability for webpage processing
mycoder config set pageFilter readability

# Set custom Ollama server URL
mycoder config set ollamaBaseUrl http://your-ollama-server:11434/api
```

## Environment Variables

- `ANTHROPIC_API_KEY`: Your Anthropic API key (required when using Anthropic models)
- `OPENAI_API_KEY`: Your OpenAI API key (required when using OpenAI models)

Note: Ollama models do not require an API key as they run locally or on a specified server.

## Development

```bash
# Clone the repository
git clone https://github.com/drivecore/mycoder.git
cd mycoder

# Install dependencies
pnpm install

# Build the CLI
pnpm build

# Run the locally built CLI
pnpm cli -i
```

## License

MIT
