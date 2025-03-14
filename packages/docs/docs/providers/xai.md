---
sidebar_position: 6
---

# xAI (Grok)

[xAI](https://x.ai/) is the company behind Grok, a powerful large language model designed to be helpful, harmless, and honest. Grok models offer strong reasoning capabilities and support for tool calling.

## Setup

To use Grok models with MyCoder, you need an xAI API key:

1. Create an account at [xAI](https://x.ai/)
2. Navigate to the API Keys section and create a new API key
3. Set the API key as an environment variable or in your configuration file

### Environment Variables

You can set the xAI API key as an environment variable:

```bash
export XAI_API_KEY=your_api_key_here
```

### Configuration

Configure MyCoder to use xAI's Grok in your `mycoder.config.js` file:

```javascript
export default {
  // Provider selection
  provider: 'xai',
  model: 'grok-2-latest',

  // Optional: Set API key directly (environment variable is preferred)
  // xaiApiKey: 'your_api_key_here',

  // Other MyCoder settings
  maxTokens: 4096,
  temperature: 0.7,
  // ...
};
```

## Supported Models

xAI offers several Grok models with different capabilities:

- `grok-2-latest` (recommended) - The latest Grok-2 model with strong reasoning and tool-calling capabilities
- `grok-1` - The original Grok model

## Best Practices

- Grok models excel at coding tasks and technical problem-solving
- They have strong tool-calling capabilities, making them suitable for MyCoder workflows
- For complex programming tasks, use Grok-2 models for best results
- Provide clear, specific instructions for optimal results

## Custom Base URL

If you need to use a different base URL for the xAI API (for example, if you're using a proxy or if xAI changes their API endpoint), you can specify it in your configuration:

```javascript
export default {
  provider: 'xai',
  model: 'grok-2-latest',
  baseUrl: 'https://api.x.ai/v1', // Default xAI API URL
};
```

## Troubleshooting

If you encounter issues with xAI's Grok:

- Verify your API key is correct and has sufficient quota
- Check that you're using a supported model name
- For tool-calling issues, ensure your functions are properly formatted
- Monitor your token usage to avoid unexpected costs

For more information, visit the [xAI Documentation](https://x.ai/docs).