# MyCoder

An open-source mono-repository containing the MyCoder agent and cli.

!NOTE: To get started with the mycoder agent, [please see the CLI package](packages/cli)

For detailed installation instructions for macOS and Linux, [see our installation guide](docs/installation.md)

## Features

- 🤖 **AI-Powered**: Leverages Anthropic's Claude and OpenAI models for intelligent decision making
- 🛠️ **Extensible Tool System**: Modular architecture with various tool categories
- 🔄 **Parallel Execution**: Ability to spawn sub-agents for concurrent task processing
- 📝 **Self-Modification**: Can modify code, it was built and tested by writing itself
- 🔍 **Smart Logging**: Hierarchical, color-coded logging system for clear output
- 👤 **Human Compatible**: Uses README.md, project files and shell commands to build its own context
- 🌐 **GitHub Integration**: GitHub mode for working with issues and PRs as part of workflow

Please join the MyCoder.ai discord for support: https://discord.gg/5K6TYrHGHt

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
