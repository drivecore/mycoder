---
sidebar_position: 1
---

# Configuration Options

MyCoder provides a comprehensive configuration system that allows you to customize its behavior according to your preferences. This page details all available configuration options and how to use them.

## Using the Configuration System

MyCoder is configured using a `mycoder.config.js` file in your project root, similar to ESLint and other modern JavaScript tools. This file exports a configuration object with your preferred settings.

```javascript
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
  customPrompt: '',
  profile: false,
  tokenCache: true,
};
```

MyCoder will search for configuration in the following places (in order of precedence):

1. CLI options (e.g., `--githubMode true`)
2. Configuration file (`mycoder.config.js`)
3. Default values

## Available Configuration Options

### AI Model Selection

| Option     | Description               | Possible Values                                   | Default                      |
| ---------- | ------------------------- | ------------------------------------------------- | ---------------------------- |
| `provider` | The AI provider to use    | `anthropic`, `openai`, `mistral`, `xai`, `ollama` | `anthropic`                  |
| `model`    | The specific model to use | Depends on provider                               | `claude-3-7-sonnet-20250219` |

Example:

```javascript
// mycoder.config.js
export default {
  // Use OpenAI as the provider with GPT-4o model
  provider: 'openai',
  model: 'gpt-4o',
};
```

### Logging and Debugging

| Option       | Description                   | Possible Values                             | Default |
| ------------ | ----------------------------- | ------------------------------------------- | ------- |
| `logLevel`   | Minimum level of logs to show | `debug`, `verbose`, `info`, `warn`, `error` | `info`  |
| `tokenUsage` | Show token usage in logs      | `true`, `false`                             | `false` |
| `profile`    | Enable performance profiling  | `true`, `false`                             | `false` |

Example:

```javascript
// mycoder.config.js
export default {
  // Enable verbose logging and token usage reporting
  logLevel: 'verbose',
  tokenUsage: true,
};
```

### Browser Integration

| Option        | Description                       | Possible Values                 | Default  |
| ------------- | --------------------------------- | ------------------------------- | -------- |
| `headless`    | Run browser in headless mode      | `true`, `false`                 | `true`   |
| `userSession` | Use existing browser session      | `true`, `false`                 | `false`  |
| `pageFilter`  | Method to process webpage content | `simple`, `none`, `readability` | `simple` |

#### System Browser Detection

MyCoder can detect and use your system-installed browsers instead of requiring Playwright's bundled browsers. This is especially useful when MyCoder is installed globally via npm.

| Option                      | Description                                | Possible Values                   | Default    |
| --------------------------- | ------------------------------------------ | --------------------------------- | ---------- |
| `browser.useSystemBrowsers` | Use system-installed browsers if available | `true`, `false`                   | `true`     |
| `browser.preferredType`     | Preferred browser engine type              | `chromium`, `firefox`, `webkit`   | `chromium` |
| `browser.executablePath`    | Custom browser executable path (optional)  | String path to browser executable | `null`     |

Example:

```javascript
// mycoder.config.js
export default {
  // Show browser windows and use readability for better web content parsing
  headless: false,
  pageFilter: 'readability',

  // System browser detection settings
  browser: {
    useSystemBrowsers: true,
    preferredType: 'firefox',
    // Optionally specify a custom browser path
    // executablePath: '/path/to/chrome',
  },
};
```

### Behavior Customization

| Option         | Description                    | Possible Values                 | Default  |
| -------------- | ------------------------------ | ------------------------------- | -------- |
| `customPrompt` | Custom instructions for the AI | Any string                      | `""`     |
| `githubMode`   | Enable GitHub integration      | `true`, `false`                 | `false`  |
| `subAgentMode` | Sub-agent workflow mode        | `'disabled'`, `'sync'`, `'async'` | `'async'` |

Example:

```javascript
// mycoder.config.js
export default {
  // Set a custom prompt to guide the AI's behavior
  customPrompt:
    'Always write TypeScript code with proper type annotations. Prefer functional programming patterns where appropriate.',

  // Enable GitHub integration
  githubMode: true,
};
```

## Configuration File Locations

MyCoder uses the [c12](https://github.com/unjs/c12) library to load configuration files, which supports multiple file locations and formats. Configuration files are searched in the following order:

1. `mycoder.config.js` (or other supported extensions) in the project root directory
2. `.mycoder.config.js` (or other supported extensions) in the project root directory
3. `.config/mycoder.js` (or other supported extensions) in the project root directory
4. `.mycoder.rc` in the project root directory
5. `.mycoder.rc` in the user's home directory (global configuration)
6. Configuration from the `mycoder` field in `package.json`
7. `~/.config/mycoder/config.js` (XDG standard user configuration)

Supported file extensions include `.js`, `.ts`, `.mjs`, `.cjs`, `.json`, `.jsonc`, `.json5`, `.yaml`, `.yml`, and `.toml`.

MyCoder will automatically detect and use these configuration files when run from within the project directory or any of its subdirectories.

## Overriding Configuration

Command-line arguments always override the stored configuration. For example:

```bash
# Use a different model provider just for this session
mycoder --provider openai "Create a React component"
```

This will use OpenAI for this session only, without changing your stored configuration.

## Configuration Examples

### Basic Configuration

```javascript
// mycoder.config.js
export default {
  provider: 'anthropic',
  model: 'claude-3-7-sonnet-20250219',
  githubMode: false,
};
```

### Advanced Configuration

```javascript
// mycoder.config.js
export default {
  // Model settings
  provider: 'anthropic',
  model: 'claude-3-7-sonnet-20250219',
  maxTokens: 4096,
  temperature: 0.7,

  // Browser settings
  headless: false,
  userSession: true,
  pageFilter: 'readability',

  // System browser detection settings
  browser: {
    useSystemBrowsers: true,
    preferredType: 'chromium',
    // executablePath: '/path/to/custom/browser',
  },

  // GitHub integration
  githubMode: true,

  // Custom settings
  customPrompt:
    'Always prioritize readability and simplicity in your code. Prefer TypeScript over JavaScript when possible.',
  profile: true,
  tokenUsage: true,
  tokenCache: true,
  
  // Sub-agent workflow mode
  subAgentMode: 'async', // Options: 'disabled', 'sync', 'async'
};
```
