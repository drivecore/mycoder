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

| Option     | Description             | Possible Values                                   | Default     |
| ---------- | ----------------------- | ------------------------------------------------- | ----------- |
| `provider` | The AI provider to use  | `anthropic`, `openai`, `mistral`, `xai`, `ollama` | `anthropic` |
| `model`    | The specific model to use | Depends on provider                             | `claude-3-7-sonnet-20250219` |

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

| Option       | Description                     | Possible Values                           | Default |
| ------------ | ------------------------------- | ----------------------------------------- | ------- |
| `logLevel`   | Minimum level of logs to show   | `debug`, `verbose`, `info`, `warn`, `error` | `info`  |
| `tokenUsage` | Show token usage in logs        | `true`, `false`                            | `false` |
| `profile`    | Enable performance profiling    | `true`, `false`                            | `false` |

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

| Option        | Description                       | Possible Values                    | Default |
| ------------- | --------------------------------- | ---------------------------------- | ------- |
| `headless`    | Run browser in headless mode      | `true`, `false`                    | `true`  |
| `userSession` | Use existing browser session      | `true`, `false`                    | `false` |
| `pageFilter`  | Method to process webpage content | `simple`, `none`, `readability`    | `simple` |

Example:
```javascript
// mycoder.config.js
export default {
  // Show browser windows and use readability for better web content parsing
  headless: false,
  pageFilter: 'readability',
};
```

### Behavior Customization

| Option         | Description                                        | Possible Values     | Default |
| -------------- | -------------------------------------------------- | ------------------- | ------- |
| `customPrompt` | Custom instructions for the AI                     | Any string          | `""`    |
| `githubMode`   | Enable GitHub integration                          | `true`, `false`     | `false` |

Example:
```javascript
// mycoder.config.js
export default {
  // Set a custom prompt to guide the AI's behavior
  customPrompt: "Always write TypeScript code with proper type annotations. Prefer functional programming patterns where appropriate.",
  
  // Enable GitHub integration
  githubMode: true,
};
```

## Configuration File Location

The `mycoder.config.js` file should be placed in the root directory of your project. MyCoder will automatically detect and use this file when run from within the project directory or any of its subdirectories.

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
  
  // GitHub integration
  githubMode: true,
  
  // Custom settings
  customPrompt: 'Always prioritize readability and simplicity in your code. Prefer TypeScript over JavaScript when possible.',
  profile: true,
  tokenUsage: true,
  tokenCache: true,
};
```