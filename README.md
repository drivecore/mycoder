# MyCoder

Command-line interface for AI-powered coding tasks. Full details available on the main [MyCoder.ai website](https://mycoder.ai) and the [Official MyCoder.Ai Docs website](https://docs.mycoder.ai).

## Features

- 🤖 **AI-Powered**: Leverages Anthropic's Claude, OpenAI models, and Ollama for intelligent coding assistance
- 🛠️ **Extensible Tool System**: Modular architecture with various tool categories
- 🔄 **Parallel Execution**: Ability to spawn sub-agents for concurrent task processing
- 📝 **Self-Modification**: Can modify code, it was built and tested by writing itself
- 🔍 **Smart Logging**: Hierarchical, color-coded logging system for clear output
- 👤 **Human Compatible**: Uses README.md, project files and shell commands to build its own context
- 🌐 **GitHub Integration**: GitHub mode for working with issues and PRs as part of workflow
- 📄 **Model Context Protocol**: Support for MCP to access external context sources

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

# Disable user prompts for fully automated sessions
mycoder --userPrompt false "Generate a basic Express.js server"

# Disable user consent warning and version upgrade check for automated environments
mycoder --upgradeCheck false "Generate a basic Express.js server"

# Enable GitHub mode via CLI option (overrides config file)
mycoder --githubMode true "Work with GitHub issues and PRs"
```

## Configuration

MyCoder is configured using a configuration file in your project. MyCoder supports multiple configuration file locations and formats, similar to ESLint and other modern JavaScript tools.

### Configuration File Locations

MyCoder will look for configuration in the following locations (in order of precedence):

1. `mycoder.config.js` in your project root
2. `.mycoder.config.js` in your project root
3. `.config/mycoder.js` in your project root
4. `.mycoder.rc` in your project root
5. `.mycoder.rc` in your home directory
6. `mycoder` field in `package.json`
7. `~/.config/mycoder/config.js` (XDG standard user configuration)

Multiple file extensions are supported: `.js`, `.ts`, `.mjs`, `.cjs`, `.json`, `.jsonc`, `.json5`, `.yaml`, `.yml`, and `.toml`.

### Creating a Configuration File

Create a configuration file in your preferred location:

```js
// mycoder.config.js
export default {
  // GitHub integration
  githubMode: true,

  // Browser settings
  headless: true,
  userSession: false,
  pageFilter: 'none', // 'simple', 'none', or 'readability'

  // Model settings
  provider: 'anthropic',
  model: 'claude-3-7-sonnet-20250219',
  maxTokens: 4096,
  temperature: 0.7,

  // Custom settings
  // customPrompt can be a string or an array of strings for multiple lines
  customPrompt: '',
  // Example of multiple line custom prompts:
  // customPrompt: [
  //   'Custom instruction line 1',
  //   'Custom instruction line 2',
  //   'Custom instruction line 3',
  // ],
  profile: false,
  tokenCache: true,

  // Base URL configuration (for providers that need it)
  baseUrl: 'http://localhost:11434', // Example for Ollama
  
  // MCP configuration
  mcp: {
    servers: [
      {
        name: 'example',
        url: 'https://mcp.example.com',
        auth: {
          type: 'bearer',
          token: 'your-token-here',
        },
      },
    ],
    defaultResources: ['example://docs/api'],
    defaultTools: ['example://tools/search'],
  },
};
```

CLI arguments will override settings in your configuration file.

### GitHub Comment Commands

MyCoder can be triggered directly from GitHub issue comments using the flexible `/mycoder` command:

```
/mycoder [your instructions here]
```

Examples:

- `/mycoder implement a PR for this issue`
- `/mycoder create an implementation plan`
- `/mycoder suggest test cases for this feature`

[Learn more about GitHub comment commands](docs/github-comment-commands.md)

## Packages

- [mycoder](packages/cli) - Command-line interface for MyCoder
- [mycoder-agent](packages/agent) - Agent module for MyCoder
- [mycoder-docs](packages/docs) - Documentation website for MyCoder

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

# Create a commit with interactive prompt
pnpm commit
```

## Release Process

MyCoder follows the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages. Our release process is fully automated:

1. Commit your changes following the conventional commits format
2. Create a PR and get it reviewed and approved
3. When merged to main, our CI/CD pipeline will:
   - Determine the next version based on commit messages
   - Generate a changelog
   - Create a GitHub Release
   - Tag the release
   - Publish to NPM

For more details, see the [Contributing Guide](CONTRIBUTING.md).

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.