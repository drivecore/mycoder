---
title: MyCoder v0.5.0 - Multi-Provider Support, Configuration System, and More
shortTitle: MyCoder v0.5.0 Release
date: 2025-03-05
authors: [ben]
tags: [ai, programming, development, tools]
---

We're excited to announce the release of MyCoder v0.5.0, our biggest update yet to the AI-powered coding assistant. This release brings several major enhancements that make MyCoder more flexible, customizable, and powerful than ever before.

<!-- truncate -->

## Multi-Provider Support

One of the most requested features is now here! MyCoder now supports multiple AI providers, giving you the freedom to choose the model that works best for your needs:

- **Anthropic**: Continue using Claude models with improved capabilities
- **OpenAI**: Access to models like GPT-4o and o3-mini
- **Mistral AI**: Use models like mistral-large and mistral-medium
- **xAI/Grok**: Support for grok-1
- **Ollama**: Run models locally for privacy and offline use

You can specify which provider and model to use with the new command line options:

```bash
mycoder --modelProvider openai --modelName gpt-4o "Your prompt here"
```

Or set them as defaults in your configuration (more on that below):

```bash
mycoder config set modelProvider openai
mycoder config set modelName gpt-4o
```

## Persistent Configuration System

MyCoder now includes a configuration system that allows you to set default values for various options. This saves you from having to specify the same options repeatedly on the command line.

### Configuration Commands

| Command                            | Description                        |
| ---------------------------------- | ---------------------------------- |
| `mycoder config list`              | List all configuration values      |
| `mycoder config get [key]`         | Get a specific configuration value |
| `mycoder config set [key] [value]` | Set a configuration value          |

You can configure everything from logging levels to browser behavior to model selection:

```bash
# Set your preferred AI provider and model
mycoder config set modelProvider openai
mycoder config set modelName gpt-4o

# Configure logging
mycoder config set logLevel verbose
mycoder config set tokenUsage true

# Configure browser behavior
mycoder config set headless false
mycoder config set pageFilter readability
```

## GitHub Integration Mode

For developers who work with GitHub, we've added a dedicated GitHub mode that seamlessly integrates with your workflow:

- Work with GitHub issues and PRs directly
- Create branches for issues automatically
- Make commits with descriptive messages
- Create PRs when work is complete

Enable GitHub mode with:

```bash
mycoder config set githubMode true
```

This requires the GitHub CLI (`gh`) to be installed and authenticated on your system.

## Custom System Prompts

You can now customize the system prompt used by MyCoder to guide the AI's behavior for your specific use cases:

```bash
# Example: Set a custom prompt to prefer TypeScript
mycoder config set customPrompt "Always use TypeScript when writing code. Prefer functional programming patterns when possible."
```

This allows you to create specialized versions of MyCoder tailored to your team's coding standards, preferred technologies, or project-specific requirements.

## Performance Profiling

To help diagnose startup times and identify bottlenecks, especially across different operating systems, we've added performance profiling:

```bash
# Enable profiling for any command
mycoder --profile "Fix the build errors"

# Or use with other commands
mycoder --profile --interactive
```

The profiling output shows detailed timing information for each initialization step:

```
📊 Performance Profile:
=======================
Module initialization: 10.12ms (10.12ms)
After imports: 150.34ms (140.22ms)
Main function start: 269.99ms (119.65ms)
After dotenv config: 270.10ms (0.11ms)
After Sentry init: 297.57ms (27.48ms)
Before package.json load: 297.57ms (0.00ms)
After package.json load: 297.78ms (0.21ms)
Before yargs setup: 297.78ms (0.00ms)
After yargs setup: 401.45ms (103.67ms)
Total startup time: 401.45ms
=======================
```

## Improved File Handling with textEditor

We've replaced the previous `readFile` and `updateFile` tools with a more powerful `textEditor` tool that provides:

- Better handling of large files
- Persistent state across command calls
- Advanced editing capabilities
- Improved display of file content

## Upgrading to v0.5.0

Upgrading to the latest version is simple:

```bash
# If installed globally
npm update -g mycoder

# Or using npx
npx mycoder@latest
```

If you're using environment variables for API keys, you may need to add additional keys for your chosen providers:

```bash
# For OpenAI
export OPENAI_API_KEY=your-api-key

# For Mistral AI
export MISTRAL_API_KEY=your-api-key

# For xAI/Grok
export XAI_API_KEY=your-api-key
```

## What's Next?

We're continuing to improve MyCoder based on your feedback. Our roadmap includes:

- Additional AI providers and models
- More specialized tools for specific development tasks
- Enhanced collaboration features
- Expanded documentation and examples

## Get Involved

We'd love to hear your thoughts on this release! Join our [Discord community](https://discord.gg/5K6TYrHGHt) to share your feedback, report issues, or suggest new features.

You can also check out our [GitHub repository](https://github.com/bhouston/mycoder) for the latest updates and to contribute to the project.

Happy coding with MyCoder v0.5.0!
