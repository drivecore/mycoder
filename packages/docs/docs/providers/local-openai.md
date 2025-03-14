---
sidebar_position: 5
---

# Local OpenAI Compatible Servers

MyCoder supports connecting to local or self-hosted OpenAI-compatible API servers, including solutions like [GPUStack](https://gpustack.ai/), [LM Studio](https://lmstudio.ai/), [Ollama OpenAI compatibility mode](https://github.com/ollama/ollama/blob/main/docs/openai.md), and [LocalAI](https://localai.io/).

## Setup

To use a local OpenAI-compatible server with MyCoder:

1. Install and set up your preferred OpenAI-compatible server
2. Start the server according to its documentation
3. Configure MyCoder to connect to your local server

### Configuration

Configure MyCoder to use your local OpenAI-compatible server in your `mycoder.config.js` file:

```javascript
export default {
  // Provider selection - use local-openai for any OpenAI-compatible server
  provider: 'local-openai',
  model: 'llama3.2', // Use the model name available on your server
  
  // The base URL for your local server
  baseUrl: 'http://localhost:80', // Default for GPUStack, adjust as needed
  
  // Other MyCoder settings
  maxTokens: 4096,
  temperature: 0.7,
  // ...
};
```

## GPUStack

[GPUStack](https://gpustack.ai/) is a solution for running AI models on your own hardware. It provides an OpenAI-compatible API server that works seamlessly with MyCoder.

### Setting up GPUStack

1. Install GPUStack following the instructions on their website
2. Start the GPUStack server
3. Configure MyCoder to use the `local-openai` provider

```javascript
export default {
  provider: 'local-openai',
  model: 'llama3.2', // Choose a model available on your GPUStack instance
  baseUrl: 'http://localhost:80', // Default GPUStack URL
};
```

## Other OpenAI-Compatible Servers

You can use MyCoder with any OpenAI-compatible server by setting the appropriate `baseUrl`:

### LM Studio

```javascript
export default {
  provider: 'local-openai',
  model: 'llama3', // Use the model name as configured in LM Studio
  baseUrl: 'http://localhost:1234', // Default LM Studio server URL
};
```

### LocalAI

```javascript
export default {
  provider: 'local-openai',
  model: 'gpt-3.5-turbo', // Use the model name as configured in LocalAI
  baseUrl: 'http://localhost:8080', // Default LocalAI server URL
};
```

### Ollama (OpenAI Compatibility Mode)

```javascript
export default {
  provider: 'local-openai',
  model: 'llama3', // Use the model name as configured in Ollama
  baseUrl: 'http://localhost:11434/v1', // Ollama OpenAI compatibility endpoint
};
```

## Hardware Requirements

Running LLMs locally requires significant hardware resources:

- Minimum 16GB RAM (32GB+ recommended)
- GPU with at least 8GB VRAM for optimal performance
- SSD storage for model files (models can be 5-20GB each)

## Best Practices

- Ensure your local server and the selected model support tool calling/function calling
- Use models optimized for coding tasks when available
- Monitor your system resources when running large models locally
- Consider using a dedicated machine for hosting your local server

## Troubleshooting

If you encounter issues with local OpenAI-compatible servers:

- Verify the server is running and accessible at the configured base URL
- Check that the model name exactly matches what's available on your server
- Ensure the model supports tool/function calling (required for MyCoder)
- Check server logs for specific error messages
- Test the server with a simple curl command to verify API compatibility:

```bash
curl http://localhost:80/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

For more information, refer to the documentation for your specific OpenAI-compatible server.