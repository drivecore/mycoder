# Contributing to MyCoder

First off, thank you for considering contributing to MyCoder! It's people like you that make MyCoder such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## Development Setup

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 10.2.1
- PostgreSQL (for Dashboard)
- Google Cloud SDK (for cloud features)
- Git

### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/mycoder-monorepo.git
   cd mycoder-monorepo
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Build all packages:
   ```bash
   pnpm build
   ```
5. Start development servers:
   ```bash
   pnpm dev
   ```

## Project Architecture

### Monorepo Structure

- `/packages/*` - All project packages
  - `agent` - Core AI agent system
  - `cli` - Command-line interface

## Development Workflow

1. Create a new branch for your feature/fix:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes, following our coding standards:

   - Use TypeScript for all new code
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. Run tests and checks:

   ```bash
   pnpm test        # Run tests
   pnpm typecheck   # Type checking
   pnpm lint        # Linting
   pnpm format      # Code formatting
   ```

4. Commit your changes:

   ```bash
   git commit -m "feat: add your feature description"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

5. Push to your fork and create a Pull Request

6. Pre-commit Hooks:

   We use [husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/okonet/lint-staged) to automatically run linting and formatting on staged files before each commit. This helps maintain code quality and consistency.

   The pre-commit hooks are configured to run:

   - `pnpm lint`: Lints the staged files using ESLint
   - `pnpm format`: Formats the staged files using Prettier
   - `pnpm build`: Ensures the project builds successfully
   - `pnpm test`: Ensures all tests pass

   If any of these commands fails, the commit will be aborted. Please fix the reported issues and try committing again.

   You can also run the lint and format commands manually at any time:

   ```bash
   pnpm lint        # Lint all files
   pnpm format      # Format all files
   ```

## Package-Specific Guidelines

### Agent Development

- Test all new tools thoroughly
- Document tool interfaces completely
- Consider parallel execution opportunities
- Add comprehensive error handling

### CLI Development

- Follow command naming conventions
- Include help text for all commands
- Add examples to documentation
- Test interactive features thoroughly

### Dashboard & Website

- Follow component architecture
- Use existing UI components
- Add Storybook stories for new components
- Ensure responsive design

### GitHub Integration

- Test webhook handlers thoroughly
- Document API interactions
- Follow security best practices
- Add integration tests

## Testing Guidelines

1. Write tests for new features
2. Maintain existing test coverage
3. Use appropriate testing tools:
   - Vitest for unit tests
   - Playwright for E2E tests
   - Component testing where appropriate

## Documentation

- Update README.md files as needed
- Document new features and changes
- Include code examples
- Update API documentation

## Getting Help

- Check existing issues and discussions
- Join our community chat
- Ask questions in pull requests
- Reach out to maintainers

## Review Process

1. All changes require review
2. Address review feedback promptly
3. Maintain civil and professional discourse
4. Be patient with the process

## Release Process

1. Maintainers will handle releases
2. Follow semantic versioning
3. Update changelog entries
4. Tag releases appropriately

Thank you for contributing to MyCoder! 👍
