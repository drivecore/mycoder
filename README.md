# MyCoder

Command-line interface for AI-powered coding tasks.

## Features

- 🤖 **AI-Powered**: Leverages Anthropic's Claude, OpenAI models, xAI/Grok, Mistral AI, and Ollama for intelligent coding assistance
- 🛠️ **Extensible Tool System**: Modular architecture with various tool categories
- 🔄 **Parallel Execution**: Ability to spawn sub-agents for concurrent task processing
- 📝 **Self-Modification**: Can modify code, it was built and tested by writing itself
- 🔍 **Smart Logging**: Hierarchical, color-coded logging system for clear output
- 👤 **Human Compatible**: Uses README.md, project files and shell commands to build its own context
- 🌐 **GitHub Integration**: GitHub mode for working with issues and PRs as part of workflow

Please join the MyCoder.ai discord for support: https://discord.gg/5K6TYrHGHt

## Installation

```bash
npm install -g mycoder
```

For detailed installation instructions for macOS and Linux, including how to set up Node.js using NVM, [see our Getting Started guide](https://docs.mycoder.ai/docs/getting-started/).

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

## Packages

- [mycoder](packages/cli) - Command-line interface for MyCoder
- [mycoder-agent](packages/agent) - Agent module for MyCoder

## Development

```bash
# Clone the repository
git clone https://github.com/drivecore/mycoder.git
cd mycoder

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
