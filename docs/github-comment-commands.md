# GitHub Comment Commands

MyCoder provides automated actions in response to `/mycoder` commands in GitHub issue comments. This feature allows you to trigger MyCoder directly from GitHub issues with flexible prompts.

## How to Use

Simply add a comment to any GitHub issue with `/mycoder` followed by your instructions:

```
/mycoder [your instructions here]
```

MyCoder will process your instructions in the context of the issue and respond accordingly.

## Examples

### Creating a PR

```
/mycoder implement a PR for this issue
```

MyCoder will:

1. Check out the repository
2. Review the issue details
3. Implement a solution according to the requirements
4. Create a pull request that addresses the issue

### Creating an Implementation Plan

```
/mycoder create an implementation plan for this issue
```

MyCoder will:

1. Review the issue details
2. Create a comprehensive implementation plan
3. Post the plan as a comment on the issue

### Other Use Cases

The `/mycoder` command is flexible and can handle various requests:

```
/mycoder suggest test cases for this feature
```

```
/mycoder analyze the performance implications of this change
```

```
/mycoder recommend libraries we could use for this implementation
```

## How It Works

This functionality is implemented as a GitHub Action that runs whenever a new comment is added to an issue. The action checks for the `/mycoder` command pattern and triggers MyCoder with the appropriate instructions.

MyCoder receives context about:

- The issue number
- The specific prompt you provided
- The comment URL where the command was triggered

If MyCoder creates a PR or takes actions outside the scope of the issue, it will report back to the issue with a comment explaining what was done.

## Requirements

For this feature to work in your repository:

1. The GitHub Action workflow must be present in your repository
2. You need to configure the necessary API keys as GitHub secrets:
   - `GITHUB_TOKEN` (automatically provided)
   - `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `XAI_API_KEY`, or `MISTRAL_API_KEY` (depending on your preferred model)

## Limitations

- The action runs with GitHub's default timeout limits
- Complex implementations may require multiple iterations
- The AI model's capabilities determine the quality of the results
