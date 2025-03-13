---
sidebar_position: 3
---

# OpenAI

[OpenAI](https://openai.com/) provides a suite of powerful language models, including the GPT family, which offer strong capabilities for code generation, analysis, and tool use.

## Setup

To use OpenAI models with MyCoder, you need an OpenAI API key:

1. Create an account at [OpenAI Platform](https://platform.openai.com/)
2. Navigate to the API Keys section and create a new API key
3. Set the API key as an environment variable or in your configuration file

### Environment Variables

You can set the OpenAI API key as an environment variable:

```bash
export OPENAI_API_KEY=your_api_key_here
```

Optionally, if you're using an organization-based account:

```bash
export OPENAI_ORGANIZATION=your_organization_id
```

### Configuration

Configure MyCoder to use OpenAI in your `mycoder.config.js` file:

```javascript
export default {
  // Provider selection
  provider: 'openai',
  model: 'gpt-4o',
  
  // Optional: Set API key directly (environment variable is preferred)
  // openaiApiKey: 'your_api_key_here',
  // openaiOrganization: 'your_organization_id',
  
  // Other MyCoder settings
  maxTokens: 4096,
  temperature: 0.7,
  // ...
};
```

## Supported Models

MyCoder supports all OpenAI models that have tool/function calling capabilities. Here are some recommended models:

- `gpt-4o` (recommended) - Latest model with strong reasoning and tool-calling capabilities
- `gpt-4-turbo` - Strong performance with 128K context window
- `gpt-4` - Original GPT-4 model with 8K context window
- `gpt-3.5-turbo` - More affordable option for simpler tasks

You can use any other OpenAI model that supports function calling with MyCoder. The OpenAI provider is not limited to just these listed models.

## Best Practices

- GPT-4o provides the best balance of performance and cost for most MyCoder tasks
- For complex programming tasks, use GPT-4 models rather than GPT-3.5
- The tool-calling capabilities in GPT-4o are particularly strong for MyCoder workflows
- Use the JSON response format for structured outputs when needed

## Troubleshooting

If you encounter issues with OpenAI:

- Verify your API key is correct and has sufficient quota
- Check that you're using a supported model name
- For rate limit issues, implement exponential backoff in your requests
- Monitor your token usage to avoid unexpected costs

For more information, visit the [OpenAI Documentation](https://platform.openai.com/docs/).