// Provider configuration map

import { providerConfig } from '../core/llm/provider.js';

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
