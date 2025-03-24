# GitHub CLI Usage in MyCoder

This document explains how to properly use the GitHub CLI (`gh`) with MyCoder, especially when creating issues, PRs, or comments with multiline content.

## Using `stdinContent` for Multiline Content

When creating GitHub issues, PRs, or comments via the `gh` CLI tool, always use the `stdinContent` parameter for multiline content:

```javascript
shellStart({
  command: 'gh issue create --body-stdin',
  stdinContent:
    'Issue description here with **markdown** support\nThis is a new line',
  description: 'Creating a new issue',
});
```

## Handling Newlines

MyCoder automatically handles newlines in two ways:

1. **Actual newlines** in template literals:

   ```javascript
   stdinContent: `Line 1
   Line 2
   Line 3`;
   ```

2. **Escaped newlines** in regular strings:
   ```javascript
   stdinContent: 'Line 1\\nLine 2\\nLine 3';
   ```

Both approaches will result in properly formatted multiline content in GitHub. MyCoder automatically converts literal `\n` sequences to actual newlines before sending the content to the GitHub CLI.

## Best Practices

- Use template literals (backticks) for multiline content whenever possible, as they're more readable
- When working with dynamic strings that might contain `\n`, don't worry - MyCoder will handle the conversion automatically
- Always use `--body-stdin` (or equivalent) flags with the GitHub CLI to ensure proper formatting
- For very large content, consider using `--body-file` with a temporary file instead

## Common Issues

If you notice that your GitHub comments or PR descriptions still contain literal `\n` sequences:

1. Make sure you're using the `stdinContent` parameter with `shellStart` or `shellExecute`
2. Verify that you're using the correct GitHub CLI flags (e.g., `--body-stdin`)
3. Check if your content is being processed by another function before reaching `stdinContent` that might be escaping the newlines
