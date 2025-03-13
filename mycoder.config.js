// mycoder.config.js
export default {
  // GitHub integration
  githubMode: true,

  // Browser settings
  headless: true,
  userSession: false,
  pageFilter: 'none', // 'simple', 'none', or 'readability'

  // Model settings
  //provider: 'anthropic',
  //model: 'claude-3-7-sonnet-20250219',
  //provider: 'openai',
  //model: 'gpt-4o',
  //provider: 'ollama',
  //model: 'medragondot/Sky-T1-32B-Preview:latest',
  //model: 'llama3.2:3b',
  maxTokens: 4096,
  temperature: 0.7,

  // Custom settings
  // customPrompt can be a string or an array of strings for multiple lines
  customPrompt: '',
  // Example of multiple line custom prompts:
  // customPrompt: [
  //   'Custom instruction line 1',
  //   'Custom instruction line 2',
  //   'Custom instruction line 3',
  // ],
  profile: false,
  tokenCache: true,
};
