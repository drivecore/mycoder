---
title: Best Practices for Efficient Agentic Coding
shortTitle: Agentic Coding Best Practices
date: 2025-03-06
authors: [ben]
tags: [ai, coding]
---

As AI coding assistants become more capable, developers are discovering new workflows that maximize their effectiveness. This post outlines best practices for organizing your codebase to work efficiently with AI agents like MyCoder.

<!-- truncate -->

As AI-based coding agents like [mycoder.ai](https://mycoder.ai) become increasingly capable, adopting structured, clear, and AI-friendly coding practices will enhance efficiency for both humans and AI agents. Here are ten best practices for efficient agentic coding:

## 1. Documentation as Code

Keep comprehensive documentation directly in your codebase:

- Place detailed `README.md` files at the root and within individual packages.
- Include a clear `CONTRIBUTING.md` outlining coding conventions and workflows.
- Add inline documentation for complex logic or non-obvious code.

**Example README.md:**

```markdown
# Frontend Package

This package contains the React frontend application.

## Directory Structure

- `src/components`: Reusable UI components
- `src/pages`: Page components corresponding to routes
- `src/hooks`: Custom React hooks
- `src/utils`: Utility functions

## Development Workflow

1. Run `npm run dev` to start the development server
2. Follow the component pattern in `src/components/Button.tsx` for new components
3. All new components must have corresponding test files

## Testing

We use Jest and React Testing Library. Run tests with `npm test`.
```

## 2. Minimize Package Explosion

Use fewer packages with clear boundaries. Only create separate packages for code shared across multiple applications.

**Preferred Structure:**

```
my-project/
  packages/
    frontend/
    backend/
    shared/
```

## 3. Simplify Project Structure

Favor flatter directory structures with semantically meaningful names to avoid deep nesting.

**Preferred Structure:**

```
src/
  auth/
    LoginForm.tsx
    SignupForm.tsx
    useAuth.ts
    validation.ts
    auth.types.ts
```

## 4. Avoid Re-exports and Indirection

Limit the use of re-exported modules to reduce confusion. Import components directly:

**Recommended import:**

```typescript
import { TextInput } from 'src/components/forms/inputs/TextInput';
```

## 5. Prefer Compile-Time Validation Over Runtime Checks

Use strong typing and compile-time validation instead of relying heavily on runtime validation:

**Type-safe approach:**

```typescript
import { createRoute, json } from 'some-router-lib';

export const userRoute = createRoute({
  path: '/users/:id',
  loader: async ({ params }) => json(await getUserDetails(params.id)),
  action: async ({ request }) =>
    json(await updateUser(await request.formData())),
  meta: () => ({ title: 'User Details' }),
});
```

## 6. Consolidate Linting and Formatting at Root Level

Centralize linting and formatting configurations at the monorepo root to ensure consistency.

**Example root-level package.json scripts:**

```json
"scripts": {
  "lint": "eslint . --fix",
  "format": "prettier . --write"
}
```

## 7. Avoid Overly Interdependent Configuration Systems

Favor self-contained, independent configuration files per package rather than complex inheritance:

```
root/
  packages/
    frontend/
      tsconfig.json
    backend/
      tsconfig.json
    shared/
      tsconfig.json
```

## 8. Type-Driven Development

Use comprehensive, precise types to enforce correctness at compile-time rather than relying on runtime validation.

Example:

```typescript
type User = {
  id: string;
  name: string;
  role: 'admin' | 'user' | 'guest';
};
```

## 9. Consistent, Predictable File Organization

Maintain consistent file structures for components:

```
components/
  Button/
    Button.tsx
    Button.test.tsx
    Button.module.css
    index.ts
```

## 10. Test-Case Driven Documentation

Write clear, self-explanatory tests that also serve as documentation:

```typescript
test('calculateDiscount applies discounts correctly', () => {
  const cart = [{ price: 100, eligible: true }];
  expect(calculateDiscount(cart)).toEqual([{ price: 90, eligible: true }]);
});
```

By adopting these agentic coding practices, your codebase will be optimized for clarity, maintainability, and efficient collaboration with AI coding agents.

_(This article is a summary of the personal blog post "[Stop Writing Code for Humans - The Future Belongs to AI Agents](https://benhouston3d.com/blog/agentic-coding-best-practices)" by Ben Houston.)_
