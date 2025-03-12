# mycoder-agent-v1.0.0 (2025-03-11)

### Bug Fixes

- **monorepo:** implement semantic-release-monorepo for proper versioning of sub-packages ([96c6284](https://github.com/drivecore/mycoder/commit/96c62848fbc3a4c1c591f3fd6202486e6461c4f2))
- only consider response empty if no text AND no tool calls ([#127](https://github.com/drivecore/mycoder/issues/127)) ([af20ec5](https://github.com/drivecore/mycoder/commit/af20ec54468afed49632306fe553b307ab3c4ba5))
- Replace shell commands with Node.js APIs for cross-platform compatibility ([07b4c24](https://github.com/drivecore/mycoder/commit/07b4c24fa17d19c468a76404a367f6afc0005517))
- token caching ([5972e59](https://github.com/drivecore/mycoder/commit/5972e59ab572040e564d1756ab8a5625215e14dc))
- use maxTokens in generateTextProps ([bfb9da9](https://github.com/drivecore/mycoder/commit/bfb9da9804d61840344e93cc5bea809e8e16f2ec))

### Features

- add back token tracking, system prompt caching. ([ddc04ab](https://github.com/drivecore/mycoder/commit/ddc04ab0778eb2f571897e825c8d8ba17651db09))
- add showStdIn and showStdout options to shellMessage and shellStart ([aed1b9f](https://github.com/drivecore/mycoder/commit/aed1b9f6ba489da19f2170c136861a7c80ad6e33)), closes [#167](https://github.com/drivecore/mycoder/issues/167)
- add token caching. issue 145 ([d78723b](https://github.com/drivecore/mycoder/commit/d78723bb6d0514110088caf7009e196e3f79769e))
- remove modelProvider and modelName - instant decrepation ([59834dc](https://github.com/drivecore/mycoder/commit/59834dcf932051a5c75624bd6f6ab12254f43769))

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
