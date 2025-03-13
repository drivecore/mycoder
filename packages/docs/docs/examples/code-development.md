---
title: Code Development
description: Examples of implementing features, fixing bugs, and writing tests
---

# Code Development

MyCoder can assist with a wide range of code development tasks, from implementing new features to fixing bugs and improving existing code. This page showcases real-world examples of effective prompts for these scenarios.

## Implementing Feature Requests

### Example: Implementing Recommendations from an Issue

```
Can you implement the recommendations 2 and 3 from issue
#44? You can look at the CI Github Actions workflow in
../mycoder-websites/.github as guide to setting up a
similar CI action that validates the build and runs
lint, etc for this repo.
```

**Why this works well:**
- References specific recommendations from an existing issue
- Points to an example implementation in another repository as a reference
- Clearly defines the scope (recommendations 2 and 3)
- Provides context about the expected outcome (CI action for build validation and linting)

**Technique:** Referencing existing issues and providing examples from other parts of the codebase helps MyCoder understand both the requirements and the implementation style.

## Architectural Changes and Refactoring

### Example: Refactoring an SDK Implementation

```
Recently this project was converted from using the
Anthropic SDK directly to using the Vercel AI SDK.
Since then it has created reliability problems. That
change was made 4 days ago in this PR:
https://github.com/drivecore/mycoder/pull/55/files

And it was built upon by adding support for ollama,
grok/xai and openai in subsequent PRs. I would like
to back out the adoption of the Vercel AI SDK, both
the 'ai' npm library as well as the '@ai-sdk' npm
libraries and thus also back out support for Ollama,
OpenAI and Grok.

In the future I will add back these but the Vercel AI
SDK is not working well. While we back this out I
would like to, as we re-implement using the Anthropic
SDK, I would like to keep some level of abstraction
around the specific LLM.

Thus I would like to have our own Message type and
it should have system, user, assistant, tool_use,
tool_result sub-types with their respective fields.
We can base it on the Vercel AI SDK. And then we
should implement a generic generateText() type that
takes messages and the tools and other standard LLM
settings and returns a new set of messages - just
as anthropic's SDK does.

We can have an Anthropic-specific function that
takes the API key + the model and returns a
generateText() function that meets the generic type.
Thus we can isolate the Anthropic specific code from
the rest of the application making it easier to
support other models in the future.

The anthropic specific implementation of generateText
will have to convert from the generic messages to
anthropics specific type of messages and after text
completion, it will need to convert back. This
shouldn't be too involved.

We can skip token caching on the first go around,
but lets create both an issue for this main conversion
I've described as well as follow on issues to add
token caching as well as OpenAI and Ollama support.
You can check out old branches of the code here if
that helps you analyze the code to understand.

I would like a plan of implementation as a comment
on the first issue - the main conversion away from
Vercel AI SDK.
```

**Why this works well:**
- Provides detailed background on the current implementation
- References specific PRs for context
- Clearly outlines the desired architecture with specific components
- Explains the rationale behind the changes
- Specifies what to include now vs. future additions
- Requests both implementation issues and a plan

**Technique:** For complex architectural changes, providing detailed context and a clear vision of the desired outcome helps MyCoder understand both the technical requirements and the reasoning behind them.

## Debugging and Troubleshooting

### Example: Investigating Build Configuration Issues

```
When I run this command \"pnpm --filter
@web3dsurvey/api-server build\" in the current
directory, it runs into an error because one of
the packages in this mono-repo upon which
@web3dsurvey/api-server is dependent is not built,
but I am confused because I thought that pnpm
would automatically build packages that are
depended upon.

I must have some part of the configuration of the
current project incorrect right? Can you create
an issue for this and then investigate. You can
use the command \"pnpm clean:dist\" to reset the
package to its non-built state.
```

**Why this works well:**
- Describes the specific command that's failing
- Explains the expected behavior and the actual outcome
- Shares the developer's hypothesis about the cause
- Provides a command for reproducing the issue
- Asks for both an issue creation and an investigation

**Technique:** When troubleshooting, providing MyCoder with the exact commands, expected behavior, and reproduction steps helps it diagnose and fix the issue more effectively.

### Example: Investigating CI Failures

```
It seems that the latest GitHub action failed,
can you investigate it and make a GitHub issue
with the problem and then push a PR that fixes
the issue? Please wait for the new GitHub
action to complete before declaring success.
```

**Why this works well:**
- Identifies a specific problem (GitHub action failure)
- Requests a complete workflow: investigation, issue creation, and fix implementation
- Sets clear expectations for verification (waiting for the GitHub action to complete)

**Technique:** Asking MyCoder to handle the full cycle from investigation to fix helps ensure that the problem is properly understood and addressed.

