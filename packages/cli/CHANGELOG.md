# mycoder

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
