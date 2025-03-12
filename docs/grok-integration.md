# Grok/XAI Integration

MyCoder supports [Grok](https://grok.x.ai/) models from xAI as an alternative to Anthropic's Claude models.

## Configuration

To use Grok models, you need to:

1. Set your XAI API key
2. Configure MyCoder to use the xai provider
3. Specify a Grok model

### Setting Your XAI API Key

```bash
mycoder config set XAI_API_KEY your-xai-api-key
```

Alternatively, you can set the `XAI_API_KEY` environment variable:

```bash
export XAI_API_KEY=your-xai-api-key
```

### Configuring the Provider

To use Grok as your default provider:

```bash
mycoder config set provider xai
```

### Selecting a Grok Model

MyCoder supports various Grok models:

```bash
# For Grok 2
mycoder config set model grok-2-1212

# For Grok 2 with vision capabilities
mycoder config set model grok-2-vision-1212

# For other available models
mycoder config set model grok-beta
mycoder config set model grok-vision-beta
```

## Using Grok for a Single Command

You can also use Grok for a single command without changing your default configuration:

```bash
mycoder --provider xai --model grok-2-1212 "Your prompt here"
```

## Features

The Grok integration supports all MyCoder features, including:

- Tool usage for complex operations
- Sub-agent spawning for parallel tasks
- GitHub mode for working with issues and PRs
- All file and shell operations

## Troubleshooting

If you encounter issues with the Grok integration, check the following:

1. Ensure your API key is correct and has sufficient permissions
2. Verify that you're using a valid model name
3. Check that your account has access to the specified model
4. Ensure your API key has not expired or been revoked

For more detailed logs, run MyCoder with increased verbosity:

```bash
mycoder --logLevel debug "Your prompt here"
```

## Comparing Models

Different models have different strengths:

- **grok-2-1212**: General-purpose model with strong coding capabilities
- **grok-2-vision-1212**: Supports image processing in addition to text
- **grok-beta**: Earlier version of Grok, may be more suitable for simpler tasks
- **grok-vision-beta**: Earlier vision-capable model

Experiment with different models to find the one that works best for your specific use case.