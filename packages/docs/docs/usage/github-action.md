---
sidebar_position: 6
---

# GitHub Action Integration

MyCoder can be seamlessly integrated into your GitHub workflow through GitHub Actions, enabling powerful automation for your repositories. This guide focuses on the `issue-comment.yml` GitHub Action, which allows you to trigger MyCoder directly from issue or PR comments.

## How It Works

The `issue-comment.yml` GitHub Action monitors comments on issues and pull requests for a specific trigger phrase (typically `/mycoder`). When detected, it launches MyCoder with the context of the issue or PR, allowing it to:

- Analyze and respond to issues
- Implement requested features
- Review pull requests
- Generate documentation
- Create new PRs with changes
- And much more

This integration creates a convenient, chat-like interface with MyCoder directly within your GitHub workflow.

## Benefits

- **Seamless Workflow Integration**: Interact with MyCoder without leaving GitHub
- **Parallel Processing**: Run multiple MyCoder instances simultaneously on different tasks
- **Contextual Understanding**: MyCoder has full access to the repository, issues, and PRs
- **Automated Task Execution**: Trigger complex tasks with a simple comment
- **Collaboration Enhancement**: AI assistance directly in your team's workflow

## Setup Guide

To add the MyCoder GitHub Action to your repository, create a file at `.github/workflows/issue-comment.yml` with the following configuration:

```yaml
name: MyCoder Issue Comment Action

on:
  issue_comment:
    types: [created]

# Top-level permissions for all jobs
permissions:
  contents: write # Required for checkout, commit, push
  issues: write # Required for issue comments
  pull-requests: write # Required for creating PRs
  discussions: write # For interaction capabilities
  statuses: write # For creating commit statuses
  checks: write # For creating check runs
  actions: read # For inspecting workflow runs
  packages: read # In case you need to access GitHub packages

env:
  PNPM_VERSION: 10.2.1 # Adjust based on your project requirements

jobs:
  process-comment:
    runs-on: ubuntu-latest
    # Only run if comment contains '/mycoder' AND commenter is authorized
    if: |
      contains(github.event.comment.body, '/mycoder') && 
      contains(fromJson('["username1", "username2"]'), github.event.comment.user.login)
    steps:
      - name: Extract prompt from comment
        id: extract-prompt
        run: |
          echo "comment_url=${{ github.event.comment.html_url }}" >> $GITHUB_OUTPUT
          echo "comment_id=${{ github.event.comment.id }}" >> $GITHUB_OUTPUT

      - name: Checkout repository
        uses: actions/checkout@v3

      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc

      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Install dependencies
        run: pnpm install

      - name: Install browsers
        run: cd packages/agent && pnpm exec playwright install --with-deps chromium

      - name: Configure Git
        run: |
          git config --global user.name "Your Name (via MyCoder)"
          git config --global user.email "your-email@example.com"

      - run:
          pnpm install -g mycoder

      # Auth GitHub CLI with the token
      - name: Configure GitHub CLI
        run: |
          echo "${{ secrets.GH_PAT }}" | gh auth login --with-token
          # Verify auth status
          gh auth status

      - env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          echo "Running MyCoder for issue #${{ github.event.issue.number }}"
          mycoder --userWarning false --upgradeCheck false --githubMode true --userPrompt false "On issue #${{ github.event.issue.number }} in comment ${{ steps.extract-prompt.outputs.comment_url }} the user invoked the mycoder CLI via /mycoder. Can you try to do what they requested or if it is unclear, respond with a comment to that effect to encourage them to be more clear."
```

## Best Practices

### Security Considerations

:::caution Important Security Warning
Only allow trusted individuals to trigger MyCoder via comments. With full repository access, MyCoder could potentially make significant changes if instructed maliciously.
:::

Restrict execution by specifying authorized users:

```yaml
if: |
  contains(github.event.comment.body, '/mycoder') && 
  contains(fromJson('["trusted-user1", "trusted-user2"]'), github.event.comment.user.login)
```

For open source projects, be especially careful about who can trigger automated workflows.

### Using Personal Access Tokens

While GitHub Actions provides a built-in `GITHUB_TOKEN`, using a Personal Access Token (PAT) is recommended:

- **Why**: Using a PAT preserves standard CI behavior on submitted PRs
- **How**: Store your PAT as a repository secret (`GH_PAT`) and reference it in the workflow

```yaml
- name: Configure GitHub CLI
  run: |
    echo "${{ secrets.GH_PAT }}" | gh auth login --with-token
```

### Disable User Prompts

Always run MyCoder with user prompts disabled in GitHub Actions:

```bash
mycoder --userPrompt false
```

This prevents the workflow from hanging indefinitely waiting for user input.

### Git Configuration

Configure Git with appropriate user information for commits made by MyCoder:

```yaml
- name: Configure Git
  run: |
    git config --global user.name "Your Name (via MyCoder)"
    git config --global user.email "your-email@example.com"
```

This clearly identifies commits made automatically by MyCoder.

## Usage Examples

### Trigger MyCoder on an Issue

Comment on any issue with:

```
/mycoder Please analyze this issue and suggest a solution.
```

### Request Documentation

```
/mycoder Please create documentation for the recently added feature XYZ.
```

### Code Review

```
/mycoder Please review this PR and suggest improvements.
```

### Feature Implementation

```
/mycoder Please implement the feature described in this issue and create a PR.
```

## Troubleshooting

If you encounter issues with the GitHub Action:

1. Check the Action logs for error messages
2. Verify that all required secrets are properly configured
3. Ensure the permissions are correctly set
4. Confirm that the commenter is in the authorized users list

## Conclusion

The MyCoder GitHub Action integration provides a powerful way to incorporate AI assistance directly into your development workflow. By following the best practices outlined above, you can safely leverage MyCoder to enhance productivity and collaboration within your GitHub repositories.