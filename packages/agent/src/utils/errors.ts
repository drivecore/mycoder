export const getAnthropicApiKeyError = () => `
Error: ANTHROPIC_API_KEY environment variable is not set

Before using MyCoder with Anthropic models, you must have an ANTHROPIC_API_KEY specified either:

- As an environment variable, "export ANTHROPIC_API_KEY=[your-api-key]" or
- In a .env file in the folder you run "mycoder" from

Get an API key from https://www.anthropic.com/api
For setup instructions, visit: https://mycoder.ai/docs/getting-started/anthropic
`;

export const getOpenAIApiKeyError = () => `
Error: OPENAI_API_KEY environment variable is not set

Before using MyCoder with OpenAI models, you must have an OPENAI_API_KEY specified either:

- As an environment variable, "export OPENAI_API_KEY=[your-api-key]" or
- In a .env file in the folder you run "mycoder" from

Get an API key from https://platform.openai.com/api-keys
For setup instructions, visit: https://mycoder.ai/docs/getting-started/openai
`;

export const getXAIApiKeyError = () => `
Error: XAI_API_KEY environment variable is not set

Before using MyCoder with xAI models, you must have an XAI_API_KEY specified either:

- As an environment variable, "export XAI_API_KEY=[your-api-key]" or
- In a .env file in the folder you run "mycoder" from

Get an API key from https://platform.xai.com
For setup instructions, visit: https://mycoder.ai/docs/getting-started/xai
`;

export const getMistralApiKeyError = () => `
Error: MISTRAL_API_KEY environment variable is not set

Before using MyCoder with Mistral models, you must have a MISTRAL_API_KEY specified either:

- As an environment variable, "export MISTRAL_API_KEY=[your-api-key]" or
- In a .env file in the folder you run "mycoder" from

Get an API key from https://console.mistral.ai/api-keys/
For setup instructions, visit: https://mycoder.ai/docs/getting-started/mistral
`;
