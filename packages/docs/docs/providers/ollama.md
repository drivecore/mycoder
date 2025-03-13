---
sidebar_position: 4
---

# Ollama

[Ollama](https://ollama.ai/) is a platform for running open-source large language models locally. It allows you to run various models on your own hardware, providing privacy and control over your AI interactions.

## Setup

To use Ollama with MyCoder:

1. Install Ollama from [ollama.ai](https://ollama.ai/)
2. Start the Ollama service
3. Pull a model that supports tool calling
4. Configure MyCoder to use Ollama

### Installing Ollama

Follow the installation instructions on the [Ollama website](https://ollama.ai/) for your operating system.

For macOS:
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

For Linux:
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

For Windows, download the installer from the Ollama website.

### Pulling a Model

After installing Ollama, you need to pull a model that supports tool calling. **Important: Most Ollama models do not support tool calling**, which is required for MyCoder.

A recommended model that supports tool calling is:

```bash
ollama pull medragondot/Sky-T1-32B-Preview:latest
```

### Environment Variables

You can set the Ollama base URL as an environment variable (defaults to http://localhost:11434 if not set):

```bash
export OLLAMA_BASE_URL=http://localhost:11434
```

### Configuration

Configure MyCoder to use Ollama in your `mycoder.config.js` file:

```javascript
export default {
  // Provider selection
  provider: 'ollama',
  model: 'medragondot/Sky-T1-32B-Preview:latest',
  
  // Optional: Custom base URL (defaults to http://localhost:11434)
  // ollamaBaseUrl: 'http://localhost:11434',
  
  // Other MyCoder settings
  maxTokens: 4096,
  temperature: 0.7,
  // ...
};
```

## Tool Calling Support

**Important**: For MyCoder to function properly, the Ollama model must support tool calling (function calling). Most open-source models available through Ollama **do not** support this feature yet.

Confirmed models with tool calling support:

- `medragondot/Sky-T1-32B-Preview:latest` - Recommended for MyCoder

If using other models, verify their tool calling capabilities before attempting to use them with MyCoder.

## Hardware Requirements

Running large language models locally requires significant hardware resources:

- Minimum 16GB RAM (32GB+ recommended)
- GPU with at least 8GB VRAM for optimal performance
- SSD storage for model files (models can be 5-20GB each)

## Best Practices

- Start with smaller models if you have limited hardware
- Ensure your model supports tool calling before using with MyCoder
- Run on a machine with a dedicated GPU for better performance
- Consider using a cloud provider's API for resource-intensive tasks if local hardware is insufficient

## Troubleshooting

If you encounter issues with Ollama:

- Verify the Ollama service is running (`ollama serve`)
- Check that you've pulled the correct model
- Ensure the model supports tool calling
- Verify your hardware meets the minimum requirements
- Check Ollama logs for specific error messages

For more information, visit the [Ollama Documentation](https://github.com/ollama/ollama/tree/main/docs).