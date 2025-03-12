# Commit Message Convention

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages. This helps automatically determine version numbers and generate changelogs.

## Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat!:` or `fix!:` - Breaking change (triggers major version bump)
- `feat:` - A new feature (triggers minor version bump)
- `fix:` - A bug fix (triggers patch version bump)
- `docs:` - Documentation only changes
- `style:` - Changes that do not affect the meaning of the code
- `refactor:` - A code change that neither fixes a bug nor adds a feature
- `perf:` - A code change that improves performance
- `test:` - Adding missing tests or correcting existing tests
- `chore:` - Changes to the build process or auxiliary tools

### Examples

```
feat(api): add new endpoint for user authentication

This new endpoint allows users to authenticate using OAuth2.

BREAKING CHANGE: `auth` endpoint now requires OAuth2 token
```

```
fix(database): resolve connection timeout issue

Increased connection timeout from 5s to 15s
```

```
docs: update README with new API documentation
```

## Changelog Generation

Commit messages are used to:

1. Automatically determine the next version number
2. Generate changelog entries
3. Create GitHub releases
