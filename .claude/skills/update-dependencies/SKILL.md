---
name: update-dependencies
description: Upgrade this repo's npm dependencies safely — dry-run ncu, apply minor/patch only, verify sanity scripts and the vitest suite with coverage thresholds, report the run. Use when the user asks to update dependencies, upgrade packages, bump deps, check for outdated packages, or run ncu.
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

Run in order, stopping on the first failure: `bun run lint`, `bun run format:check`, `bun run lint:package`, `bun run typecheck`, `bun run lint:unused`, `bun run lint:duplication`, `bun run build`.

Check each script's own exit code — the shell is zsh, so `PIPESTATUS` doesn't exist and piping into `tail` masks failures. Redirect to a file instead: `bun run <script> >/tmp/out.txt 2>&1; echo $?`.

- `prettier` in the applied set → a `format:check` failure on previously-clean files is expected on new rules. Run `bun run format`, then confirm the diff only touches the files `format:check` flagged — a wider diff means something else broke.
- `knip` in the applied set → new "Configuration hints" are not failures; only a non-zero exit is.
- Any other failure: trivial fix (type signature, import path) → apply and continue. Real API break → stop, report, never downgrade unilaterally to route around it.

Done when: all seven scripts exit 0.

## 4. Run tests

```bash
bun run test:coverage
```

Same command CI runs (`.github/workflows/ci.yml`). Coverage thresholds are enforced, so a drop below them fails the run even when every test passes.

Done when: the suite exits 0 and reports its pass/fail counts.

## 5. Report

Rank skipped majors by adoption risk: lint/test-only deps with no in-repo usage rank lowest; runtime deps with heavy in-repo usage, or several majors jumped at once, rank highest. In this repo `typescript` is always high risk — its API is used at runtime (`src/rules/max-params-project.ts`, `src/utils/type.utils.ts`, and `src/cli/sensors/comment-sensor.ts` loads it from the target project), and it must stay compatible with typescript-eslint.

Report to the user: what upgraded, majors skipped with risk ranking, anything hit plus the fix applied, sanity/test result.

Done when: the user has the summary.

## 6. Commit (only if the user asks)

Releases are cut by semantic-release, so the commit type decides whether a version ships. Use `chore(deps): bump minor/patch deps` for dev-only bumps (no release). Use `fix(deps): ...` only when a runtime dependency in `dependencies`/`peerDependencies` changed and consumers should get a new version.
