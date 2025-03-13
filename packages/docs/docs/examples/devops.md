---
title: DevOps
description: Setting up CI/CD, Docker configurations, and environment management
---

# DevOps

MyCoder can help with various DevOps tasks, including setting up CI/CD pipelines, configuring Docker, and managing build environments. This page showcases real-world examples of effective prompts for these scenarios.

## CI/CD Configuration

### Example: Setting Up GitHub Actions Workflows

```
Can you implement the recommendations 2 and 3 from
issue #44. You can look at the CI Github Actions
workflow in ../mycoder-websites/.github as guide
to setting up a similar CI action that validates
the build and runs lint, etc for this repo.
```

**Why this works well:**
- References specific recommendations from an existing issue
- Points to an example implementation in another repository
- Clearly defines the expected outcome (CI action for build validation and linting)

**Technique:** Providing reference implementations helps MyCoder understand your preferred approach to CI/CD configuration.

## Package Manager Configuration

### Example: Converting from npm to pnpm

```
I think that the github action workflows and maybe
the docker build are still making assumptions about
using npm rather than pnpm. Can you look at
../Business/drivecore/mycoder-websites as an example
of docker files that use pnpm and also github action
workflows that use pnpm and adapt the current project
to use that style. Please create a github issue and
then once the task is complete please submit a PR.
```

**Why this works well:**
- Identifies a specific configuration issue (npm vs. pnpm)
- Points to a reference implementation with the desired approach
- Clearly defines the expected deliverables (GitHub issue and PR)

**Technique:** When migrating between different tools or approaches, providing MyCoder with examples of the target configuration helps ensure consistency.

## Build Configuration Troubleshooting

### Example: Investigating Mono-Repo Build Issues

```
When I run this command \"pnpm --filter
@web3dsurvey/api-server build\" in the current directory,
it runs into an error because one of the packages in
this mono-repo upon which @web3dsurvey/api-server is
dependent is not built, but I am confused because I
thought that pnpm would automatically build packages
that are depended upon.

I must have some part of the configuration of the
current project incorrect right? Can you create an
issue for this and then investigate. You can use
the command \"pnpm clean:dist\" to reset the package 
to its non-built state.
```

**Why this works well:**
- Describes the specific command that's failing
- Explains the expected behavior and the actual outcome
- Shares the developer's hypothesis about the cause
- Provides a command for reproducing the issue

**Technique:** For build configuration issues, providing MyCoder with the exact commands and expected behavior helps it diagnose and fix configuration problems effectively.

## Investigating CI/CD Failures

### Example: Debugging GitHub Actions

```
It seems that the latest GitHub action failed, can you
investigate it and make a GitHub issue with the problem
and then push a PR that fixes the issue? Please wait
for the new GitHub action to complete before declaring
success.
```

**Why this works well:**
- Identifies a specific problem (GitHub action failure)
- Requests a complete workflow: investigation, issue creation, and fix implementation
- Sets clear expectations for verification

**Technique:** Having MyCoder investigate CI failures helps identify and resolve configuration issues that might be complex or time-consuming to debug manually.
