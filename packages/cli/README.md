# MyCoder CLI

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

# Combine file input with interactive prompts
mycoder -f prompt.txt -i

# Disable user prompts for fully automated sessions
mycoder --userPrompt false "Generate a basic Express.js server"

# Disable user consent warning and version upgrade check for automated environments
mycoder --upgradeCheck false "Generate a basic Express.js server"

# Enable GitHub mode via CLI option (overrides config file)
mycoder --githubMode true
```

## GitHub Mode

MyCoder includes a GitHub mode that enables the agent to work with GitHub issues and PRs as part of its workflow. When enabled, the agent will:

- Start from existing GitHub issues or create new ones for tasks
- Create branches for issues it's working on
- Make commits with descriptive messages
- Create PRs when work is complete
- Create additional GitHub issues for follow-up tasks or ideas

GitHub mode is **enabled by default** but requires the Git and GitHub CLI tools to be installed and configured:

- Git CLI (`git`) must be installed
- GitHub CLI (`gh`) must be installed and authenticated

MyCoder will automatically check for these requirements when GitHub mode is enabled and will:

- Warn you if any requirements are missing
- Automatically disable GitHub mode if the required tools are not available or not authenticated

To manually enable/disable GitHub mode:

1. Via CLI option (overrides config file):

```bash
mycoder --githubMode true   # Enable GitHub mode
mycoder --githubMode false  # Disable GitHub mode
```

2. Via configuration file:

```js
// mycoder.config.js
export default {
  githubMode: true, // Enable GitHub mode (default)
  // other configuration options...
};
```

Requirements for GitHub mode:

- Git CLI (`git`) needs to be installed
- GitHub CLI (`gh`) needs to be installed and authenticated
- User needs to have appropriate GitHub permissions for the target repository

If GitHub mode is enabled but the requirements are not met, MyCoder will provide instructions on how to install and configure the missing tools.

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

  // Model settings
  provider: 'anthropic',
  model: 'claude-3-7-sonnet-20250219',
  // Manual override for context window size (in tokens)
  // Useful for models that don't have a known context window size
  // contextWindow: 16384,
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

  // Custom commands
  // Uncomment and modify to add your own commands
  /*
  commands: {
    // Function-based command example
    "search": {
      description: "Search for a term in the codebase",
      args: [
        { name: "term", description: "Search term", required: true }
      ],
      execute: (args) => {
        return `Find all instances of ${args.term} in the codebase and suggest improvements`;
      }
    },
    
    // Another example with multiple arguments
    "fix-issue": {
      description: "Fix a GitHub issue",
      args: [
        { name: "issue", description: "Issue number", required: true },
        { name: "scope", description: "Scope of the fix", default: "full" }
      ],
      execute: (args) => {
        return `Analyze GitHub issue #${args.issue} and implement a ${args.scope} fix`;
      }
    }
  }
  */
};
```

MyCoder will search for configuration in the following places (in order of precedence):

1. CLI options (e.g., `--githubMode true`)
2. Configuration file (`mycoder.config.js`)
3. Default values

### Model Selection

NOTE: Anthropic Claude 3.7 works the best by far in our testing.

MyCoder supports Anthropic, OpenAI, and Ollama models. You can configure which model provider and model name to use either via CLI options or in your configuration file:

```bash
# Via CLI options (overrides config file)
mycoder --provider anthropic --model claude-3-7-sonnet-20250219 "Your prompt here"
```

Or in your configuration file:

```js
// mycoder.config.js
export default {
  // Model settings
  provider: 'anthropic',
  model: 'claude-3-7-sonnet-20250219', // or any other Anthropic model
  // other configuration options...
};
```

### Available Configuration Options

- `githubMode`: Enable GitHub mode (requires "gh" cli to be installed) for working with issues and PRs (default: `true`)
- `headless`: Run browser in headless mode with no UI showing (default: `true`)
- `userSession`: Use user's existing browser session instead of sandboxed session (default: `false`)
- `customPrompt`: Custom instructions to append to the system prompt for both main agent and sub-agents (default: `""`)
- `mcp`: Configuration for Model Context Protocol (MCP) integration (default: `{ servers: [], defaultResources: [] }`)
- `commands`: Custom commands that can be executed via the CLI (default: `{}`)

### Model Context Protocol (MCP) Configuration

MyCoder supports the [Model Context Protocol (MCP)](https://modelcontextprotocol.io), which allows the agent to access external context sources and tools. MyCoder uses the official [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) package for MCP integration.

To configure MCP support, add an `mcp` section to your `mycoder.config.js` file:

```javascript
// mycoder.config.js
export default {
  // Other configuration...

  // MCP configuration
  mcp: {
    // MCP Servers to connect to
    servers: [
      {
        name: 'company-docs',
        url: 'https://mcp.example.com/docs',
        // Optional authentication
        auth: {
          type: 'bearer',
          token: process.env.MCP_SERVER_TOKEN,
        },
      },
    ],

    // Optional: Default context resources to load
    defaultResources: ['company-docs://api/reference'],

    // Optional: Default tools to make available
    defaultTools: ['company-docs://tools/search'],
  },
};
```

When MCP is configured, the agent will have access to a new `mcp` tool that allows it to:

- List available resources from configured MCP servers
- Fetch resources to use as context for its work
- List available tools from configured MCP servers
- Execute tools provided by MCP servers

### CLI-Only Options

These options are available only as command-line parameters and are not stored in the configuration:

- `upgradeCheck`: Disable version upgrade check for automated/remote usage (default: `true`)
- `userPrompt`: Enable or disable the userPrompt tool (default: `true`)

Example setting these options via CLI arguments (which will override the config file):

```bash
# Set browser to show UI for this session only
mycoder --headless false "Your prompt here"

# Use existing browser session for this session only
mycoder --userSession true "Your prompt here"
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
