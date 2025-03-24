# MyCoder PR Review Guidelines

This document outlines the criteria and guidelines that MyCoder uses when reviewing pull requests. These guidelines help ensure that contributions maintain high quality and consistency with the project's standards.

## Issue Alignment

- Does the PR directly address the requirements specified in the linked issue?
- Are all the requirements from the original issue satisfied?
- Does the PR consider points raised in the issue discussion?
- Is there any scope creep (changes not related to the original issue)?

## Code Quality

- **Clean Design**: Is the code design clear and not overly complex?
- **Terseness**: Is the code concise without sacrificing readability?
- **Duplication**: Does the code avoid duplication? Are there opportunities to reuse existing code?
- **Consistency**: Does the code follow the same patterns and organization as the rest of the project?
- **Naming**: Are variables, functions, and classes named clearly and consistently?
- **Comments**: Are complex sections adequately commented? Are there unnecessary comments?

## Function and Component Design

- **Single Responsibility**: Does each function or component have a clear, single purpose?
- **Parameter Count**: Do functions have a reasonable number of parameters?
- **Return Values**: Are return values consistent and well-documented?
- **Error Handling**: Is error handling comprehensive and consistent?
- **Side Effects**: Are side effects minimized and documented where necessary?

## Testing

- Are there appropriate tests for new functionality?
- Do the tests cover edge cases and potential failure scenarios?
- Are the tests readable and maintainable?

## Documentation

- Is new functionality properly documented?
- Are changes to existing APIs documented?
- Are README or other documentation files updated if necessary?

## Performance Considerations

- Are there any potential performance issues?
- For computationally intensive operations, have alternatives been considered?

## Security Considerations

- Does the code introduce any security vulnerabilities?
- Is user input properly validated and sanitized?
- Are credentials and sensitive data handled securely?

## Accessibility

- Do UI changes maintain or improve accessibility?
- Are there appropriate ARIA attributes where needed?

## Browser/Environment Compatibility

- Will the changes work across all supported browsers/environments?
- Are there any platform-specific considerations that need addressing?

## Follow-up Review Guidelines

When reviewing updates to a PR:

- Focus on whether previous feedback has been addressed
- Acknowledge improvements and progress
- Provide constructive guidance for any remaining issues
- Be encouraging and solution-oriented
- Avoid repeating previous feedback unless clarification is needed
- Help move the PR towards completion rather than finding new issues

Remember that the goal is to help improve the code while maintaining a positive and constructive environment for all contributors.