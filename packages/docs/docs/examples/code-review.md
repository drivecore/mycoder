---
title: Code Review
description: Using MyCoder to review PRs, analyze code quality, and suggest improvements
---

# Code Review

MyCoder is excellent at reviewing code, analyzing PRs, and providing feedback on potential improvements. This page showcases real-world examples of effective prompts for these scenarios.

## PR Review and Analysis

### Example: Reviewing a PR for Potential Duplication

```
In the current PR #45, which fixes issue #44 and it
is also currently checked out as the current branch,
there isn't duplication of the checks are there? In
your writeup you say that \"added pre-push hook with
the same validation\". It seems that we have both a
pre-commit hook and a pre-push hook that do the same
thing? Won't that slow things down?
```

**Why this works well:**
- References a specific PR and issue
- Quotes specific text from the PR description
- Asks a focused question about a potential issue (duplication)
- Expresses concern about a specific impact (performance slowdown)

**Technique:** When reviewing PRs, asking MyCoder targeted questions about specific aspects helps surface potential issues that might not be immediately obvious.

## Identifying Configuration Issues

### Example: Reviewing Package Manager Configuration

```
I think that the github action workflows and maybe the
docker build are still making assumptions about using
npm rather than pnpm. Can you look at
../Business/drivecore/mycoder-websites as an example
of docker files that use pnpm and also github action
workflows that use pnpm and adapt the current project 
yo use that style. Please create a github issue and
then once the task is complete please submit a PR.
```

**Why this works well:**
- Identifies a specific concern (npm vs. pnpm assumptions)
- Points to a reference implementation with the desired approach
- Clearly defines the expected deliverables (GitHub issue and PR)
- Provides context about the current state and desired outcome

**Technique:** Asking MyCoder to compare configurations across projects helps identify inconsistencies and standardize approaches.

## UI and Design Review

### Example: Requesting UI Improvements

```
Can you make the blue that is used for the links to
be a little more dark-grey blue? And can you remove
the underline from links by default? Please create
a Github issue for this and a PR.
```

**Why this works well:**
- Makes specific, focused requests for UI changes
- Clearly describes the desired outcome
- Specifies the process (create an issue and PR)

**Technique:** For UI changes, being specific about the desired visual outcome helps MyCoder implement changes that match your expectations.
