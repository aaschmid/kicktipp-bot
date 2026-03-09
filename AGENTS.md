# Agent Guidelines for kicktipp-bot

## Commits

All commits must follow this format and be signed off:

```
<Commit message (imperative, concise, 50-72 chars)>

<What happened>

Co-authored-by: <AppName>/<Model>
Signed-off-by: <Your Name> <your.email@example.com>
```

Use imperative mood ("Fix" not "Fixed", "Add" not "Added").

Example:

```
Implement odds prediction strategy

Added `predictWithOddsStrategy` function with linear regression for game outcome prediction. Includes unit tests for various edge cases.

Co-authored-by: openai/gpt-4
Signed-off-by: John Doe <john.doe@example.com>
```

## Continuous Integration

CI runs on every push via `.github/workflows/ci.yml` and includes, formatting, linting, testing, license and type checking.

## Build, Lint, and Test Commands

### Primary Commands

- `pnpm build` - Compile TypeScript
- `pnpm start` - Run the main application

Scheduled runs are configured in `.github/workflows/schedule.yml`.

### Testing

- `pnpm test` - Run full test suite (format, lint, license check, unit tests, build)

Run a specific test file: `pnpm test:unit src/predictor/predictor.test.ts`

### Code Quality

- `pnpm test:format` - Check formatting with Prettier
- `pnpm test:format:fix` - Fix formatting issues with Prettier
- `pnpm test:lint` - Check linting with ESLint
- `pnpm test:lint:fix` - Fix linting issues with ESLint

## Code Style Guidelines

### Formatting

Prettier is used for code formatting with the following settings:

- Print width: 140 characters
- Indentation: 2 spaces
- Trailing commas: always
- Line endings: LF

### Coding Conventions

- Handle cookie banners and dialogs proactively
- Use try-finally to ensure cleanup (browser/context closing)
- Throw early for missing configuration required environment variables
- Use try-catch with logging for expected error conditions
- Import logging library and log errors with context (e.g., logger.error(message, error, metadata))
- Type checking is enforced during test runs
- Load dotenv in non-production environments
- Define clear interfaces for data structures (e.g., `GameOdds`, `GameResult`)
- Use type assertions using `as` sparingly and only with clear intent
- Name strategy functions like `predictWith<StrategyName>Strategy`
- Use most minimal named exports for most functions/types and group imports: local imports first, then external
- Minimal inline comments, i.e. comment only non-obvious logic or external references

### Test Writing Guidelines

- Organize tests by describe blocks with clear names matching the function under test
- Test edge cases: empty inputs, null values, boundary conditions
- Include assertions for both success and error paths

### Exhaustive Type Checking

For switch statements over union types, include a default case that throws:

```typescript
default: {
  const exhaustiveCheck: never = strategy;
  throw new Error(`Strategy ${strategy} not supported.`);
}
```
