---
title: Project Management
description: Using MyCoder for planning, issue creation, and project organization
---

# Project Management

MyCoder excels at helping with project management tasks such as creating issues, planning work, and organizing projects. This page provides real-world examples of effective prompts for these scenarios.

## Creating Multiple Related Issues

### Example: Requesting Multiple GitHub Issues for Project Improvements

```
Can you create a Github issue for removing the base
tsconfig.json file and instead just using fully
defined tsconfig.json files in each package in
both the packages folder and the services folder?
Complex tsconfig.json strategies with shared
settings can introduce a lot of unnecessary complexity.

Can you also make a Github issue for combining
all packages into a single packages folder rather
than having them split between packages and
services? There isn't enough packages to warrant
the split here.

Third can you create an issue for updating the
root README.md so that it describes the project,
what each package does and the main ways developers
(and agentic agents) should interact with it?
```

**Why this works well:**
- Clearly defines multiple distinct tasks
- Provides rationale for each requested change
- Specifies the exact deliverables (GitHub issues)
- Includes context about the current project structure

**Technique:** Breaking larger refactoring efforts into focused, manageable issues helps maintain project clarity and allows for incremental improvements.

## Implementing Multiple Issues in a Single PR

### Example: Requesting Implementation of Multiple Related Issues

```
Can you implement github issue #31 and also #30 and
do a combined PR back to Github?
```

**Why this works well:**
- Concise and direct
- References specific issue numbers
- Clearly states the expected outcome (a combined PR)
- Groups related issues together for efficient implementation

**Technique:** When issues are closely related, having MyCoder implement them together can reduce overhead and ensure consistent implementation.

### Example: Implementing a Specific Issue

```
Can you execute issue 32 and make a PR for it back
to github?
```

**Why this works well:**
- Simple, direct instruction
- References a specific issue by number
- Clearly states the expected outcome (a PR)

**Technique:** Using GitHub issue numbers as references
gives MyCoder the context it needs to understand the
task without repeating all the details.

## Project Assessment and Issue Creation

### Example: Investigating Build Failures and Creating Issues

```
You just created PR #34 which fixes issues #30 and #31.
But the CI is failing, you can check the Github Actions
to see why. Can you address the issue?

I do worry that your recent reorganization of the repo
may not align with some of the assumptions in the Github
action workflows or maybe the docker files or something.
Anyhow, please have a look and if you can fix it, please do.

If the issue is unrelated to the two issues you fixed
in the recent PR, then make a Github issue to capture
the problem and make a separate PR to fix it.
```

**Why this works well:**
- Provides clear context about the current situation
- Specifies a diagnostic approach (check GitHub Actions)
- Offers a hypothesis about potential causes
- Provides decision criteria for how to proceed (fix directly or create a separate issue)
- Sets clear expectations for deliverables

**Technique:** When dealing with unexpected issues, providing MyCoder with both the immediate problem and guidance on how to categorize and address it helps maintain project organization.

## Project Verification

### Example: Checking Build Status

```
Can you confirm the project builds? I am not sure it does.
```

**Why this works well:**
- Simple, direct question
- Focuses on a specific verification task
- Implicitly asks MyCoder to attempt building the project and report results

**Technique:** Using MyCoder for verification tasks leverages its ability to execute commands and interpret results, providing you with actionable information.
