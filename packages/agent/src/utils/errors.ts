// Provider configuration map
export const providerConfig: Record<
  string,
  { keyName: string; docsUrl: string } | undefined
> = {
  anthropic: {
    keyName: 'ANTHROPIC_API_KEY',
    docsUrl: 'https://mycoder.ai/docs/getting-started/anthropic',
  },
  openai: {
    keyName: 'OPENAI_API_KEY',
    docsUrl: 'https://mycoder.ai/docs/getting-started/openai',
  },
  /*xai: {
    keyName: 'XAI_API_KEY',
    docsUrl: 'https://mycoder.ai/docs/getting-started/xai',
  },
  mistral: {
    keyName: 'MISTRAL_API_KEY',
    docsUrl: 'https://mycoder.ai/docs/getting-started/mistral',
  },*/
  // No API key needed for ollama as it uses a local server
  ollama: undefined,
};

/**
 * Generates a provider-specific API key error message
 * @param provider The LLM provider name
 * @returns Error message with provider-specific instructions
 */
export const getProviderApiKeyError = (provider: string): string => {
  const config = providerConfig[provider];

  if (!config) {
    return `Unknown provider: ${provider}`;
  }

  const { keyName, docsUrl } = config;
  const platform = process.platform;
  let osSpecificInstructions = '';

  if (platform === 'win32') {
    osSpecificInstructions = `- Using the windows command prompt, "setx ${keyName}=[your-api-key]"`;
  } else if (platform === 'darwin' || platform === 'linux') {
    osSpecificInstructions = `- As an environment variable, "export ${keyName}=[your-api-key]"`;
  }

  return `
Error: ${keyName} environment variable is not set

Before using MyCoder with ${provider} models, you must have a ${keyName} specified.

There are many ways you can set it, for example:
${osSpecificInstructions}
- In a .env file in the folder you run "mycoder" from

For setup instructions, visit: ${docsUrl}
`;
};

// Legacy function for backward compatibility
export const getAnthropicApiKeyError = () =>
  getProviderApiKeyError('anthropic');
