# MyCoder Mono-repository

An open-source mono-repository containing the MyCoder agent and cli.

!NOTE: To get started with the mycoder agent, [please see the CLI package](packages/cli)

undefined

Please join the MyCoder.ai discord for support: https://discord.gg/5K6TYrHGHt

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 10.2.1
- ANTHROPIC_API_KEY (for AI features)

### Installation

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run locally built cli in interactive mode
pnpm cli -i
```

## 📦 Packages

### [`cli`](packages/cli)

Command-line interface for AI-powered coding tasks:

- Interactive mode
- File-based prompt support
- Code migration and refactoring capabilities

### [`agent`](packages/agent)

Core AI agent system powering MyCoder's intelligent features:

- Extensible Tool System
- Parallel Execution with sub-agents
- AI-Powered using Anthropic's Claude API

## 🛠 Development

### Common Commands

```bash
# Development mode
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Formatting
pnpm format

# Clean build artifacts
pnpm clean

# Clean everything including node_modules
pnpm clean:all
```

## 📚 Documentation

Each package contains detailed documentation in its respective README.md file. See individual package directories for:

- Detailed setup instructions
- API documentation
- Development guidelines
- Package-specific commands

## 📦 Publishing

This monorepo uses [Changesets](https://github.com/changesets/changesets) to manage versions and publish packages. The following packages are published to npm:

- `mycoder` - CLI package
- `mycoder-agent` - Core agent functionality

To publish changes:

1. Make your code changes
2. Create a changeset (documents your changes):

   ```bash
   pnpm changeset
   ```

3. Select the packages that have changes
4. Write a clear description of the changes
5. Commit the generated changeset file

When ready to publish:

1. Update versions based on changesets:

   ```bash
   pnpm changeset version
   ```

2. Review the changes
3. Publish packages:

   ```bash
   pnpm publish -r
   ```

Note: Both packages are versioned together to ensure compatibility.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
