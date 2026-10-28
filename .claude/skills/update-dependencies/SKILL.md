---
name: update-dependencies
description: Upgrade this repo's npm dependencies safely — dry-run ncu, apply minor/patch only, verify sanity scripts, run e2e with manual MSAL auth, report the run. Use when the user asks to update dependencies, upgrade packages, bump deps, check for outdated packages, or run ncu.
---

Upgrades every minor/patch-bumpable dependency in one pass, skips majors, then proves the upgrade didn't break anything before reporting. Never bump a major in this flow — log it for a separate, deliberate pass instead.

## 1. Classify

```bash
bunx npm-check-updates
```

Sort every listed package into two sets by comparing its leftmost version segment: unchanged = minor/patch (safe), changed = major (skip).

Done when: every listed package is sorted into one of the two sets.

## 2. Apply the safe set

```bash
bunx npm-check-updates -u -x <comma-separated-major-pkgs>
bun install
```

Excluding majors up front keeps this idempotent — rerunning after a partial failure is safe.

Done when: `bun install` exits 0.

## 3. Verify sanity scripts

Run in order, stopping on the first failure: `bun run lint`, `bun run format:check`, `bun run lint:package`, `bun run typecheck`, `bun run build`.

- `@playwright/test` in the applied set → proactively run `bunx playwright install chromium firefox` before touching e2e. Even a patch bump can orphan the cached browser binaries (`browserType.launch: Executable doesn't exist` otherwise) — don't wait for the failure.
- `prettier` in the applied set → a `format:check` failure on previously-clean files is expected on new rules. Run `bun run format`, then confirm the diff only touches the files `format:check` flagged — a wider diff means something else broke.
- Ignore as pre-existing, not a regression: the `[MODULE_TYPELESS_PACKAGE_JSON]` eslint warning, and the "chunks larger than 500 kB" build warning.
- Any other failure: trivial fix (type signature, import path) → apply and continue. Real API break → stop, report, never downgrade unilaterally to route around it.

Done when: all five scripts exit 0.

## 4. Run e2e

```bash
bun run test:e2e:auth:setup
```

Opens Playwright Inspector headed for a real Azure AD login — it can't be automated. Wait for the user to confirm they've logged in and clicked Resume before continuing.

```bash
bun run test:e2e
```

Done when: the full suite reports its pass/fail counts.

## 5. Report

Rank skipped majors by adoption risk: lint/test-only deps with no in-repo usage rank lowest; framework/runtime deps with heavy in-repo usage, or several majors jumped at once, rank highest.

Report to the user: what upgraded, majors skipped with risk ranking, anything hit plus the fix applied, sanity/e2e result.

Done when: the user has the summary.
