/**
 * Examples of using the LLM abstraction
 */
import { FunctionDefinition, Message } from './types.js';

import { createProvider, generateText } from './index.js';

/**
 * Example of using the OpenAI provider
 */
async function _openaiExample() {
  // Create an OpenAI provider
  const provider = createProvider('openai', 'gpt-4', {
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Define messages
  const messages: Message[] = [
    {
      role: 'system',
      content:
        'You are a helpful assistant that can use tools to accomplish tasks.',
    },
    {
      role: 'user',
      content: 'What is the weather in New York?',
    },
  ];

  // Define functions/tools
  const functions: FunctionDefinition[] = [
    {
      name: 'get_weather',
      description: 'Get the current weather in a location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city and state, e.g. San Francisco, CA',
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
            description: 'The unit of temperature',
          },
        },
        required: ['location'],
      },
    },
  ];

  // Generate text
  const response = await generateText(provider, {
    messages,
    functions,
    temperature: 0.7,
    maxTokens: 1000,
  });

  console.log('Generated text:', response.text);
  console.log('Tool calls:', response.toolCalls);

  // Handle tool calls
  if (response.toolCalls.length > 0) {
    const toolCall = response.toolCalls[0];
    if (toolCall) {
      console.log(`Tool called: ${toolCall.name}`);
      console.log(`Arguments: ${toolCall.content}`);

      // Example of adding a tool result
      const toolResult: Message = {
        role: 'tool_result',
        tool_use_id: toolCall.id,
        content: JSON.stringify({
          temperature: 72,
          unit: 'fahrenheit',
          description: 'Sunny with some clouds',
        }),
        is_error: false,
      };

      // Continue the conversation with the tool result
      const followupResponse = await generateText(provider, {
        messages: [
          ...messages,
          {
            role: 'assistant',
            content: response.text,
          },
          toolResult,
        ],
        temperature: 0.7,
        maxTokens: 1000,
      });

      console.log('Follow-up response:', followupResponse.text);
    }
  }
}

// Example usage
// openaiExample().catch(console.error);
