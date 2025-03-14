# [mycoder-v1.4.0](https://github.com/drivecore/mycoder/compare/mycoder-v1.3.1...mycoder-v1.4.0) (2025-03-14)


### Bug Fixes

* perfect gpustack compatibility, fix openai edge case ([9359f62](https://github.com/drivecore/mycoder/commit/9359f62e5b2f66c0db76bf9bb00161eb6964a888))


### Features

* replace cosmiconfig with c12 for configuration management ([cc17315](https://github.com/drivecore/mycoder/commit/cc17315da6a8c7a7b63958a7b10f11f7de5e521d)), closes [#260](https://github.com/drivecore/mycoder/issues/260)
* support multiple line custom prompts in mycoder.config.js ([fa7f45e](https://github.com/drivecore/mycoder/commit/fa7f45ea9e81fa73fba0afa099e127fbdeaf5281)), closes [#249](https://github.com/drivecore/mycoder/issues/249)

# [mycoder-v1.3.1](https://github.com/drivecore/mycoder/compare/mycoder-v1.3.0...mycoder-v1.3.1) (2025-03-13)

### Bug Fixes

- redo ollama llm provider using ollama sdk ([586fe82](https://github.com/drivecore/mycoder/commit/586fe827d048aa6c13675ba838bd50309b3980e2))

# [mycoder-v1.3.0](https://github.com/drivecore/mycoder/compare/mycoder-v1.2.0...mycoder-v1.3.0) (2025-03-12)

### Features

- implement MCP tools support ([2d99ac8](https://github.com/drivecore/mycoder/commit/2d99ac8cefaa770e368d469355a509739aafe6a3))

# [mycoder-v1.2.0](https://github.com/drivecore/mycoder/compare/mycoder-v1.1.1...mycoder-v1.2.0) (2025-03-12)

### Features

- Add basic Model Context Protocol (MCP) support ([8ec9619](https://github.com/drivecore/mycoder/commit/8ec9619c3cc63df8f14222762f5da0bcabe273a5))
- **agent:** implement incremental resource cleanup for agent lifecycle ([576436e](https://github.com/drivecore/mycoder/commit/576436ef2c7c5f234f088b7dba2e7fd65590738f)), closes [#236](https://github.com/drivecore/mycoder/issues/236)
- background tools is now scope to agents ([e55817f](https://github.com/drivecore/mycoder/commit/e55817f32b373fdbff8bb1ac90105b272044d33f))

# [mycoder-v1.1.1](https://github.com/drivecore/mycoder/compare/mycoder-v1.1.0...mycoder-v1.1.1) (2025-03-12)

### Bug Fixes

- remove userWarning option from docs and Github Action. ([35617c1](https://github.com/drivecore/mycoder/commit/35617c19a4a03ba5c170b93d035bdf99ddb81544))

# [mycoder-v1.1.0](https://github.com/drivecore/mycoder/compare/mycoder-v1.0.0...mycoder-v1.1.0) (2025-03-12)

### Bug Fixes

- implement resource cleanup to prevent CLI hanging issue ([d33e729](https://github.com/drivecore/mycoder/commit/d33e7298686a30661ee8b36f2fdffb16f5f3da71)), closes [#141](https://github.com/drivecore/mycoder/issues/141)
- llm choice working well for openai, anthropic and ollama ([68d34ab](https://github.com/drivecore/mycoder/commit/68d34abf8a73ed533a072359ce334a9364753425))
- remove unreliable init command and createDefaultConfigFile function ([5559567](https://github.com/drivecore/mycoder/commit/5559567d1986e828983f5975495bee89fcd91772)), closes [#225](https://github.com/drivecore/mycoder/issues/225)
- replace @semantic-release/npm with @anolilab/semantic-release-pnpm to properly resolve workspace references ([bacb51f](https://github.com/drivecore/mycoder/commit/bacb51f637f2b2d3b1039bdfdbd33e3d704b6cde))

### Features

- add git and gh CLI tools availability check ([8996f36](https://github.com/drivecore/mycoder/commit/8996f3609d3d13a62dd9943bfe2e846508a70336)), closes [#217](https://github.com/drivecore/mycoder/issues/217)
- add Ollama configuration options ([d5c3a96](https://github.com/drivecore/mycoder/commit/d5c3a96ce9463c98504c2a346796400df36bf3b0))
- **cli:** Add checking for git and gh CLI tools in GitHub mode ([5443185](https://github.com/drivecore/mycoder/commit/54431854e1e02de2a3c6bf993b114993739dcca1)), closes [#217](https://github.com/drivecore/mycoder/issues/217)
- **llm:** add OpenAI support to LLM abstraction ([7bda811](https://github.com/drivecore/mycoder/commit/7bda811658e15b8dd41135cd9b2b90e9ea925e15))
- **refactor:** agent ([a2f59c2](https://github.com/drivecore/mycoder/commit/a2f59c2f51643a44d6e1ff0c16b319deb1adc3f2))
- Replace config CLI commands with config file-based approach ([#215](https://github.com/drivecore/mycoder/issues/215)) ([8dffcef](https://github.com/drivecore/mycoder/commit/8dffcef10c123c05ef6970c465c4d8b3f0475622))

# mycoder-v1.0.0 (2025-03-11)

### Bug Fixes

- add deepmerge to cli package.json ([ab66377](https://github.com/drivecore/mycoder/commit/ab66377342c9f23fa874d2776e73d365141e8801))
- don't save consent when using --userWarning=false ([41cf69d](https://github.com/drivecore/mycoder/commit/41cf69dee22acc31cd0f2aa9f80e36cd867fb20b))
- **monorepo:** implement semantic-release-monorepo for proper versioning of sub-packages ([96c6284](https://github.com/drivecore/mycoder/commit/96c62848fbc3a4c1c591f3fd6202486e6461c4f2))
- update hierarchical configuration system to fix failing tests ([93d949c](https://github.com/drivecore/mycoder/commit/93d949c03b7ebe96bad36713f6476c38d2a35224))

### Features

- add --githubMode and --userPrompt as boolean CLI options that override config settings ([0390f94](https://github.com/drivecore/mycoder/commit/0390f94651e40de93a8cb9486a056a0b9cb2e165))
- add CLI options for automated usage scenarios ([00419bc](https://github.com/drivecore/mycoder/commit/00419bc3e060db6d0c18fc72e2d7b6957791c875))
- add maxTokens and temperature config options to CLI ([b461d3b](https://github.com/drivecore/mycoder/commit/b461d3b71b686d7679ecac62c0c66cc5a1df8fec)), closes [#118](https://github.com/drivecore/mycoder/issues/118)
- implement hierarchical configuration system ([84d73d1](https://github.com/drivecore/mycoder/commit/84d73d1e6324670890a203f455fe257aeb6ed07a)), closes [#153](https://github.com/drivecore/mycoder/issues/153)
- remove modelProvider and modelName - instant decrepation ([59834dc](https://github.com/drivecore/mycoder/commit/59834dcf932051a5c75624bd6f6ab12254f43769))

# mycoder

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
- Updated dependencies [5f43eeb]
  - mycoder-agent@0.6.1

## 0.6.0

### Minor Changes

- Simplify browser message tool parameter schema to make it easier for AI to call.

### Patch Changes

- Updated dependencies
  - mycoder-agent@0.6.0

## 0.5.0

### Minor Changes

- a51b970: Convert from JsonSchema7Type to ZodSchema for tool parameters and returns, required for Vercel AI SDK integration.
- 27f73e3: Add GitHub mode to MyCoder for working with issues and PRs
- 66ff39e: Add support for OpenAI models (o3 mini and GPT-4o) via Vercel AI SDK
- 9b9d953: Add performance profiler via --profile to diagnose slow start-up times on some OSes.
- 9b9d953: Use cross platform compatibility tooling to build up context, rather than Linux/MacOS specific tools.

## 0.4.0

### Minor Changes

- Adds sentry error reporting for quality monitoring.

### Patch Changes

- Updated dependencies
  - mycoder-agent@0.4.0

## 0.3.0

### Minor Changes

- Better browser experience: show browser, take over user session, content filter, robustness improvements to browsing.

### Patch Changes

- Updated dependencies
  - mycoder-agent@0.3.0

## 0.2.3

### Patch Changes

- Ensure all logging follows logLevel cli option.

## 0.2.2

### Patch Changes

- Fix version check to handle packages in the future (like during dev)

## 0.2.1

### Patch Changes

- Removed debug logging, fixed package.json urls for git repo.
- Updated dependencies
  - mycoder-agent@0.2.1

## 0.2.0

### Minor Changes

- Add token caching, better user input handling, token usage logging (--tokenUsage), the ability to see the browser (--headless=false), and log prefixes with emojis.

### Patch Changes

- Updated dependencies
  - mycoder-agent@0.2.0

## 0.2.2

### Patch Changes

- Replaced `--tokenLog` with `--tokenUsage` boolean flag that outputs token usage at info log level when enabled

## 0.2.1

### Patch Changes

- Added `--tokenLog` option to output token usage at specified log level (defaults to debug), helping to monitor token caching effectiveness

## 0.2.0

### Minor Changes

- Make the warning a consent based single show to reduce distractions. Made the initial user prompt green to better conform to the user prompts from the agents being green.

## 0.1.3

### Patch Changes

- Improved sub-agent directions, do not assume a lack of a response is an agent being done, rather look for explicit confirmation, allow for sub-agents to have optional custom working directorires, break agent framework into the mycoder-agent package
- Updated dependencies
  - mycoder-agent@0.1.3

## 0.1.2

### Patch Changes

- add sleep tool to allow the agent to wait for tasks (like browse or shell commands) to complete.

## 0.1.1

### Patch Changes

- add respawn tool to help reduce context size

## 0.1.0

### Minor Changes

- Add support for browsing the web

## 0.0.23

### Patch Changes

- upgrade dependency to fix windows bug

## 0.0.22

### Patch Changes

- Alternative windows fix

## 0.0.21

### Patch Changes

- Fix windows compatibility for cli tool.

## 0.0.20

### Patch Changes

- A very fast and simple background version check

## 0.0.19

### Patch Changes

- ensure the cli works on windows

## 0.0.18

### Patch Changes

- better fix for linux cli that still hides deprecations

## 0.0.17

### Patch Changes

- Fix the linux cli and add a test to ensure it doesn't break again.

## 0.0.16

### Patch Changes

- Improve check for new versions, simplify the logging.

## 0.0.15

### Patch Changes

- add support for async shell commands, but retain sync mode while viewing async as fallback

## 0.0.14

### Patch Changes

- Add new version check, use sub-agents for context more freely.

## 0.0.13

### Patch Changes

- Put all development guidelines in contributing.md and not in readme.md

## 0.0.12

### Patch Changes

- ensure warning always appears

## 0.0.11

### Patch Changes

- reduce expectations in the readme to start

## 0.0.10

### Patch Changes

- add warning, better docs, license

## 0.0.9

### Patch Changes

- Remove test files

## 0.0.8

### Patch Changes

- improved checking for API KEY

## 0.0.7

### Patch Changes

- Cleaner log output

## 0.0.6

### Patch Changes

- Better agent prompt

## 0.0.5

### Patch Changes

- refactor default command to use yargs-file-commands, added -i alias for interactive mode

## 0.0.4

### Patch Changes

- fix dependencies for runtime

## 0.0.3

### Patch Changes

- Fixed readme file that got clobbered.

## 0.0.2

### Patch Changes

- c762ce8: Initial public release
