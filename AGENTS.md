# Agent Guidelines for kicktipp-bot

This file provides guidelines for agentic coding assistants working on this repository.

## Conventional Commits

All commits must follow this format (see also `~/.config/git/template_commit`) and be signed off:

```
<Commit message (imperative, concise, 50-72 chars)>

<What happened>

Co-authored-by: <AppName>/<Model>
Signed-off-by: <Your Name> <your.email@example.com>
```

Use imperative mood ("Fix" not "Fixed", "Add" not "Added").

## Build, Lint, and Test Commands

### Primary Commands

- `pnpm build` - Compile TypeScript
- `pnpm start` - Run the main application
- `pnpm test` - Run full test suite (lint, license check, unit tests, build)

### Testing

- `pnpm test:unit` - Run all unit tests with type checking
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:ui` - Open Vitest UI to run tests interactively

### Running Single Tests

Run a specific test file: `pnpm test:unit src/predictor/predictor.test.ts`

### Linting

- `pnpm test:lint` - Run ESLint
- `pnpm test:lint:fix` - Run ESLint with auto-fix

## Code Style Guidelines

### Formatting

- Print width: 140 characters
- Indentation: 2 spaces
- Trailing commas: always
- Line endings: LF

### TypeScript Configuration

- Strict mode enabled
- `noImplicitReturns`: true
- `noUnusedParameters`: true
- `forceConsistentCasingInFileNames`: true
- ES2020 target, ESNext modules

### Type Conventions

- Use `import type` for type-only imports when possible
- Define clear interfaces for data structures (e.g., `GameOdds`, `GameResult`)
- Use string literal unions for constrained types (e.g., `PredictionStrategy`)
- Type assertions using `as` sparingly and with clear intent

### Naming Conventions

- **Variables/functions**: camelCase (`predictGame`, `handleCookieBanner`)
- **Interfaces/Types**: PascalCase (`GameOdds`, `PredictionStrategy`)
- **Constants**: UPPER_SNAKE_CASE for module-level constants
- **Strategy functions**: `predictWith<StrategyName>Strategy` pattern

### Error Handling

- Throw descriptive `Error` objects with clear messages
- Throw early for missing configuration required environment variables
- Use try-catch with logging for expected error conditions
- Provide context in error messages (e.g., which values are missing)

### Exhaustive Type Checking

For switch statements over union types, include a default case that throws:

```typescript
default: {
  const exhaustiveCheck: never = strategy;
  throw new Error(`Strategy ${strategy} not supported.`);
}
```

### Import Organization

- Group imports: local imports first, then external
- Use named exports for most functions/types
- Minimize use of default exports

### Testing Patterns

- Use Vitest with `test.each` for parameterized tests
- Test names should describe input and expected output
- Use `expect().toBeOneOf()` for non-deterministic results (random-based functions)
- Import test utilities from "vitest"
- Type checking is enforced during test runs

### Environment Configuration

- Load dotenv in non-production environments
- Validate all required environment variables at startup
- Use `process.env.VAR as string` for type assertions with validation
- Reference .env_sample for required environment variables

### Async/Await Patterns

- Always await Playwright page operations
- Use `waitFor` for visibility/state checks
- Handle cookie banners and dialogs proactively
- Use try-finally to ensure cleanup (browser/context closing)

### Code Organization

- Separate page objects/domain logic (pages/ directory)
- Separate business logic (predictor/ directory)
- Keep configuration centralized (config.ts)
- Export interfaces used by other modules

### Comments

- Minimal inline comments
- Comment only non-obvious logic or external references
- Inline flags for specific eslint rules when necessary

### License Compliance

- Only allow: Apache-2.0, BSD-2-Clause, MIT
- Check with `pnpm license:check` before adding dependencies
