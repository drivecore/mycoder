---
sidebar_position: 2
---

# Anthropic (Claude)

[Anthropic](https://www.anthropic.com/) is the company behind the Claude family of large language models, known for their strong reasoning capabilities, long context windows, and robust tool-calling support.

## Setup

To use Claude models with MyCoder, you need an Anthropic API key:

1. Create an account at [Anthropic Console](https://console.anthropic.com/)
2. Navigate to the API Keys section and create a new API key
3. Set the API key as an environment variable or in your configuration file

### Environment Variables

You can set the Anthropic API key as an environment variable:

```bash
export ANTHROPIC_API_KEY=your_api_key_here
```

### Configuration

Configure MyCoder to use Anthropic's Claude in your `mycoder.config.js` file:

```javascript
export default {
  // Provider selection
  provider: 'anthropic',
  model: 'claude-3-7-sonnet-20250219',
  
  // Optional: Set API key directly (environment variable is preferred)
  // anthropicApiKey: 'your_api_key_here',
  
  // Other MyCoder settings
  maxTokens: 4096,
  temperature: 0.7,
  // ...
};
```

## Supported Models

Anthropic offers several Claude models with different capabilities and price points:

- `claude-3-7-sonnet-20250219` (recommended) - Strong reasoning and tool-calling capabilities with 200K context
- `claude-3-5-sonnet-20240620` - Balanced performance and cost with 200K context
- `claude-3-opus-20240229` - Most capable model with 200K context
- `claude-3-haiku-20240307` - Fastest and most cost-effective with 200K context

## Best Practices

- Claude models excel at complex reasoning tasks and multi-step planning
- They have strong tool-calling capabilities, making them ideal for MyCoder workflows
- Claude models have a 200K token context window, allowing for large codebases to be processed
- For cost-sensitive applications, consider using Claude Haiku for simpler tasks

## Token Caching

MyCoder implements token caching for Anthropic's Claude models to optimize performance and reduce API costs:

- Token caching stores and reuses parts of the conversation history
- The Anthropic provider uses Claude's native cache control mechanisms
- This significantly reduces token usage for repeated or similar queries
- Cache efficiency is automatically optimized based on conversation context

You can enable or disable token caching in your configuration:

```javascript
export default {
  provider: 'anthropic',
  model: 'claude-3-7-sonnet-20250219',
  tokenCache: true, // Enable token caching (default is true)
};
```

## Troubleshooting

If you encounter issues with Anthropic's Claude:

- Verify your API key is correct and has sufficient quota
- Check that you're using a supported model name
- For tool-calling issues, ensure your functions are properly formatted
- Monitor your token usage to avoid unexpected costs

For more information, visit the [Anthropic Documentation](https://docs.anthropic.com/).