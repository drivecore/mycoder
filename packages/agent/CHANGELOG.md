# mycoder-agent

## [0.7.0](https://github.com/drivecore/mycoder/compare/v0.6.1...v0.7.0) (2025-03-10)

### Bug Fixes

- change where anthropic key is declared ([f6f72d3](https://github.com/drivecore/mycoder/commit/f6f72d3bc18a65fc775151cd375398aba230a06f))
- ensure npm publish only happens on release branch ([ec352d6](https://github.com/drivecore/mycoder/commit/ec352d6956c717726ef388a07d88372c12b634a6))

### Features

- add GitHub Action for issue comment commands ([136950f](https://github.com/drivecore/mycoder/commit/136950f4bd6d14e544bbd415ed313f7842a9b9a2)), closes [#162](https://github.com/drivecore/mycoder/issues/162)
- allow for generic /mycoder commands ([4b6608e](https://github.com/drivecore/mycoder/commit/4b6608e0b8e5f408eb5f12fe891657a5fb25bdb4))
- **release:** implement conventional commits approach ([5878dd1](https://github.com/drivecore/mycoder/commit/5878dd1a56004eb8a994d40416d759553b022eb8)), closes [#140](https://github.com/drivecore/mycoder/issues/140)

## 0.6.1

### Patch Changes

- 5f43eeb: Improve check for API keys with better help messages.

## 0.6.0

### Minor Changes

- Simplify browser message tool parameter schema to make it easier for AI to call.

## 0.5.0

### Minor Changes

- a51b970: Convert from JsonSchema7Type to ZodSchema for tool parameters and returns, required for Vercel AI SDK integration.
- 27f73e3: Add GitHub mode to MyCoder for working with issues and PRs
- 66ff39e: Add support for OpenAI models (o3 mini and GPT-4o) via Vercel AI SDK
- 9b9d953: Add performance profiler via --profile to diagnose slow start-up times on some OSes.
- 27c2ba5: Refactored toolAgent.ts into modular components for improved maintainability and testability. Split into config.ts, messageUtils.ts, toolExecutor.ts, tokenTracking.ts, and types.ts modules.
- a4331b8: Add textEditor tool that combines readFile and updateFile functionality
- 9b9d953: Use cross platform compatibility tooling to build up context, rather than Linux/MacOS specific tools.

### Patch Changes

- 870cbee: Re-implemented token caching for Vercel AI SDK usage with Anthropic provider to reduce token consumption during repeated API calls.

## 0.4.0

### Minor Changes

- Adds sentry error reporting for quality monitoring.

## 0.3.0

### Minor Changes

- Better browser experience: show browser, take over user session, content filter, robustness improvements to browsing.

## 0.2.1

### Patch Changes

- Removed debug logging, fixed package.json urls for git repo.

## 0.2.0

### Minor Changes

- Add token caching, better user input handling, token usage logging (--tokenUsage), the ability to see the browser (--headless=false), and log prefixes with emojis.

## 0.1.3

### Patch Changes

- Improved sub-agent directions, do not assume a lack of a response is an agent being done, rather look for explicit confirmation, allow for sub-agents to have optional custom working directorires, break agent framework into the mycoder-agent package
