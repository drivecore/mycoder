## [0.10.1](https://github.com/drivecore/mycoder/compare/v0.10.0...v0.10.1) (2025-03-11)


### Bug Fixes

* token caching ([5972e59](https://github.com/drivecore/mycoder/commit/5972e59ab572040e564d1756ab8a5625215e14dc))

# [0.10.0](https://github.com/drivecore/mycoder/compare/v0.9.0...v0.10.0) (2025-03-11)


### Bug Fixes

* add deepmerge to cli package.json ([ab66377](https://github.com/drivecore/mycoder/commit/ab66377342c9f23fa874d2776e73d365141e8801))
* update hierarchical configuration system to fix failing tests ([93d949c](https://github.com/drivecore/mycoder/commit/93d949c03b7ebe96bad36713f6476c38d2a35224))


### Features

* add back token tracking, system prompt caching. ([ddc04ab](https://github.com/drivecore/mycoder/commit/ddc04ab0778eb2f571897e825c8d8ba17651db09))
* add showStdIn and showStdout options to shellMessage and shellStart ([aed1b9f](https://github.com/drivecore/mycoder/commit/aed1b9f6ba489da19f2170c136861a7c80ad6e33)), closes [#167](https://github.com/drivecore/mycoder/issues/167)
* add token caching.  issue 145 ([d78723b](https://github.com/drivecore/mycoder/commit/d78723bb6d0514110088caf7009e196e3f79769e))
* implement hierarchical configuration system ([84d73d1](https://github.com/drivecore/mycoder/commit/84d73d1e6324670890a203f455fe257aeb6ed07a)), closes [#153](https://github.com/drivecore/mycoder/issues/153)

# [0.9.0](https://github.com/drivecore/mycoder/compare/v0.8.0...v0.9.0) (2025-03-11)


### Bug Fixes

* don't save consent when using --userWarning=false ([41cf69d](https://github.com/drivecore/mycoder/commit/41cf69dee22acc31cd0f2aa9f80e36cd867fb20b))


### Features

* add CLI options for automated usage scenarios ([00419bc](https://github.com/drivecore/mycoder/commit/00419bc3e060db6d0c18fc72e2d7b6957791c875))

# [0.8.0](https://github.com/drivecore/mycoder/compare/v0.7.0...v0.8.0) (2025-03-11)

### Features

- add --githubMode and --userPrompt as boolean CLI options that override config settings ([0390f94](https://github.com/drivecore/mycoder/commit/0390f94651e40de93a8cb9486a056a0b9cb2e165))
- remove modelProvider and modelName - instant decrepation ([59834dc](https://github.com/drivecore/mycoder/commit/59834dcf932051a5c75624bd6f6ab12254f43769))

# [0.7.0](https://github.com/drivecore/mycoder/compare/v0.6.1...v0.7.0) (2025-03-10)

### Bug Fixes

- change where anthropic key is declared ([f6f72d3](https://github.com/drivecore/mycoder/commit/f6f72d3bc18a65fc775151cd375398aba230a06f))
- ensure npm publish only happens on release branch ([ec352d6](https://github.com/drivecore/mycoder/commit/ec352d6956c717726ef388a07d88372c12b634a6))

### Features

- add GitHub Action for issue comment commands ([136950f](https://github.com/drivecore/mycoder/commit/136950f4bd6d14e544bbd415ed313f7842a9b9a2)), closes [#162](https://github.com/drivecore/mycoder/issues/162)
- allow for generic /mycoder commands ([4b6608e](https://github.com/drivecore/mycoder/commit/4b6608e0b8e5f408eb5f12fe891657a5fb25bdb4))
- **release:** implement conventional commits approach ([5878dd1](https://github.com/drivecore/mycoder/commit/5878dd1a56004eb8a994d40416d759553b022eb8)), closes [#140](https://github.com/drivecore/mycoder/issues/140)
