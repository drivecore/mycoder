# GitHub Comment Commands

MyCoder provides automated actions in response to specific commands in GitHub issue comments. This feature allows you to trigger MyCoder directly from GitHub issues.

## Available Commands

### `/mycoder pr`

When you add a comment with `/mycoder pr` to any issue, MyCoder will:

1. Check out the repository
2. Review the issue details
3. Implement a solution according to the requirements
4. Create a pull request that addresses the issue

Example:
```
This looks like a great feature to add!

/mycoder pr
```

### `/mycoder plan`

When you add a comment with `/mycoder plan` to any issue, MyCoder will:

1. Review the issue details
2. Create a comprehensive implementation plan
3. Post the plan as a comment on the issue

Example:
```
I'm not sure about the best approach for this.

/mycoder plan
```

## How It Works

This functionality is implemented as a GitHub Action that runs whenever a new comment is added to an issue. The action checks for these specific command patterns and triggers MyCoder with the appropriate instructions.

## Requirements

For this feature to work in your repository:

1. The GitHub Action workflow must be present in your repository
2. You need to configure the necessary API keys as GitHub secrets:
   - `GITHUB_TOKEN` (automatically provided)
   - `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `XAI_API_KEY`, or `MISTRAL_API_KEY` (depending on your preferred model)

## Limitations

- The action runs with GitHub's default timeout limits
- Complex implementations may require multiple iterations
- The AI model's capabilities determine the quality of the implementation or plan