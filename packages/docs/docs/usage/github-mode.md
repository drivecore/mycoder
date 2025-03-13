---
sidebar_position: 2
---

# GitHub Mode

MyCoder's GitHub mode integrates AI-powered coding assistance directly with your GitHub workflow. When enabled, MyCoder can work with issues, create branches, make commits, and open pull requests as part of its operation.

## Prerequisites

Before using GitHub mode, you need:

1. The GitHub CLI (`gh`) installed and authenticated
   ```bash
   # Install GitHub CLI
   # macOS
   brew install gh
   
   # Windows
   winget install --id GitHub.cli
   
   # Ubuntu/Debian
   sudo apt install gh
   ```

2. Authenticate with GitHub
   ```bash
   gh auth login
   ```

## Enabling GitHub Mode

Enable GitHub mode using the configuration file:

```javascript
// mycoder.config.js
export default {
  githubMode: true,
};
```

Or use it for a single session:

```bash
mycoder --githubMode true "Fix the bug described in issue #42"
```

## GitHub Mode Features

When GitHub mode is enabled, MyCoder will:

### 1. Work with GitHub Issues

MyCoder can read existing issues, create new ones, and mark them as completed:

```bash
# Work on an existing issue
mycoder "Fix issue #42"

# Create a new issue
mycoder "Create an issue for the memory leak in the cache system"
```

### 2. Create Feature Branches

MyCoder automatically creates appropriately named branches when working on issues:

```
# Example branch names
fix/issue-42-memory-leak
feature/add-dark-mode
refactor/improve-error-handling
```

### 3. Make Commits with Descriptive Messages

MyCoder creates commits with detailed, descriptive messages that explain the changes:

```
# Example commit message
Fix memory leak in cache system (#42)

- Added proper cleanup of cached objects in the dispose method
- Implemented weak references for large objects
- Added unit tests to verify memory is properly released
```

### 4. Create Pull Requests

When work is complete, MyCoder can create pull requests with:
- Descriptive title
- Detailed description of changes
- Reference to the original issue
- Test results and validation steps

## Example Workflow

Here's an example of how GitHub mode works in practice:

1. Start with an issue (existing or new)
   ```bash
   mycoder "Create an issue for implementing dark mode"
   ```

2. Work on the issue
   ```bash
   mycoder "Implement the dark mode feature described in issue #53"
   ```

3. MyCoder will:
   - Create a branch like `feature/issue-53-dark-mode`
   - Make necessary code changes
   - Commit changes with descriptive messages
   - Create a pull request when complete

## Advanced GitHub Mode Options

### Custom Pull Request Templates

MyCoder respects your repository's PR templates. If you have a `.github/PULL_REQUEST_TEMPLATE.md` file, MyCoder will use it when creating PRs.

### Working with Multiple Repositories

MyCoder works in the current git repository. To work with multiple repositories, simply navigate to the appropriate directory before running MyCoder.

### Handling Complex GitHub Workflows

If your team uses a complex GitHub workflow (e.g., with code owners, required reviews, or CI gates), MyCoder will create the PR according to your repository's requirements, but you'll need to handle the review and merge process manually.

## Troubleshooting

### Common Issues

- **Authentication Problems**: Ensure you've run `gh auth login` successfully
- **Permission Issues**: Verify you have write access to the repository
- **Branch Protection**: Some repositories have branch protection rules that may prevent direct pushes

If you encounter any issues with GitHub mode, you can check the GitHub CLI status with:

```bash
gh auth status
```

For persistent problems, please report them on our [Discord server](https://discord.gg/5K6TYrHGHt).