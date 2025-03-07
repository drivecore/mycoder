# LLM-Interface Migration

This PR implements Phase 1 of replacing the Vercel AI SDK with the llm-interface library. The changes include:

## Changes Made

1. Removed Vercel AI SDK dependencies:
   - Removed `ai` package
   - Removed `@ai-sdk/anthropic` package
   - Removed `@ai-sdk/mistral` package
   - Removed `@ai-sdk/openai` package
   - Removed `@ai-sdk/xai` package
   - Removed `ollama-ai-provider` package

2. Added llm-interface dependency:
   - Added `llm-interface` package

3. Updated core components:
   - Updated `config.ts` to use llm-interface for model initialization
   - Updated `toolAgentCore.ts` to use llm-interface for LLM interactions
   - Updated `messageUtils.ts` to handle message formatting for llm-interface
   - Updated `toolExecutor.ts` to work with the new message format
   - Updated `tokens.ts` to prepare for token tracking with llm-interface

## Current Status

- Basic integration with Anthropic's Claude models is working
- All tests are passing
- The agent can successfully use tools with Claude models

## Future Work

This PR is the first phase of a three-phase migration:

1. Phase 1 (this PR): Basic integration with Anthropic models
2. Phase 2: Add support for OpenAI, xAI, and Ollama models
3. Phase 3: Implement token caching with llm-interface

## Benefits of llm-interface

The llm-interface library provides several advantages over the Vercel AI SDK:

1. Simpler and more consistent API for interacting with multiple LLM providers
2. Better error handling and retry mechanisms
3. More flexible caching options
4. Improved documentation and examples
5. Regular updates and active maintenance

## Testing

The changes have been tested by:
1. Running the existing test suite
2. Manual testing of the agent with various prompts and tools