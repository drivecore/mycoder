# MyCoder CLI

Command-line interface for AI-powered coding tasks.

## Features

- 🤖 **AI-Powered**: Leverages Anthropic's Claude API for intelligent coding assistance
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
```

## Environment Variables

- `ANTHROPIC_API_KEY`: Your Anthropic API key (required)

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
