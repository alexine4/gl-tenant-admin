# Unit Test Execution

## Run Unit Tests

### 1. Execute All Unit Tests
```bash
pnpm run test
```
This runs `vitest run` against every `*.test.ts` file in the repository.

### 2. Review Test Results
- **Expected**: 5 test files, 33 tests, 0 failures (see `aidlc-docs/construction/tech-debt-cleanup/code/test-summary.md` for what each file covers)
- **Test Coverage**: No coverage tool is configured in this pass (out of scope per `requirements.md`); coverage is scoped qualitatively to `lib/auth.ts` and the validation/serialization logic in `lib/branding.ts`, `lib/documents.ts`, `lib/tenant-users.ts`, `lib/analytics.ts`
- **Test Report Location**: Console output from `pnpm run test`; Vitest also prints a fast-check seed automatically if any property-based test fails, for reproduction

### 3. Fix Failing Tests
If tests fail:
1. Review the Vitest console output — it names the failing test and, for property-based tests, prints the shrunk minimal failing input and the seed
2. Reproduce with the printed seed if needed
3. Fix the underlying code or test
4. Rerun `pnpm run test` until all pass

## Property-Based Test Notes
- Framework: `fast-check`, integrated directly into the Vitest test files (no separate config needed)
- Shrinking is enabled by default and never disabled in this suite (PBT-08)
- `lib/documents.test.ts`'s size-boundary test is the slowest (~0.7s) due to allocating large buffers for oversized-file cases — this is expected and not a regression signal
