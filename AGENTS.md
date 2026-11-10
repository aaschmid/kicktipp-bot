# Agent Guidelines for kicktipp-bot

## JSON edit validation

After using the edit tool on a JSON file (package.json, tsconfig.json, biome.json, ...), immediately
validate it with `node -e "JSON.parse(require('fs').readFileSync('<file>', 'utf8'))"` before the next
command. Multi-block edits can displace closing braces or add trailing commas that only surface later
as cryptic errors from other tools.

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

CI runs on every push via `.github/workflows/ci.yml` and includes formatting, linting, license, unit test, and build checks.

## Build, Lint, and Test Commands

Local pnpm is pinned via `packageManager` in `package.json` (pnpm 12); run `pnpm install` after dependency changes.

### Primary Commands

- `pnpm build` - Compile TypeScript
- `pnpm start` - Run the main application

Scheduled runs are configured in `.github/workflows/schedule.yml`.

### Testing

- `pnpm test` - Run full test suite (format, lint, license check, unit tests, build)

Run a specific test file: `pnpm test:unit src/predictor/predictor.test.ts`

### Code Quality

- `pnpm test:format` - Check formatting with Biome
- `pnpm test:format:fix` - Fix formatting issues with Biome
- `pnpm test:lint` - Check linting with Biome
- `pnpm test:lint:fix` - Fix linting issues with Biome
- License check lives in `scripts/check-licenses.mjs` (wraps `pnpm licenses list --prod --json`, fails on licenses outside the allowlist)

## Code Style Guidelines

### Formatting

Biome is used for both formatting and linting, configured in `biome.json` with the following settings:

- Print width: 140 characters
- Indentation: 2 spaces
- Double quotes
- Trailing commas: all
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

## Tooling migrations

When a change swaps build or lint tooling (package manager, formatter, linter, test runner), grep
`AGENTS.md` and `README.md` for the old tool's name and update them in the same commit. Docs describing
tooling rot silently because no linter reads them.

### Test Writing Guidelines

- Organize tests by describe blocks with clear names matching the function under test
- Test edge cases: empty inputs, null values, boundary conditions
- Include assertions for both success and error paths

### Exhaustive Type Checking

For switch statements over union types, include a default case that throws:

```typescript
default: {
  // biome-ignore lint/correctness/noUnusedVariables: needed for exhaustive switch check
  const exhaustiveCheck: never = strategy;
  throw new Error(`Strategy ${strategy} not supported.`);
}
```
