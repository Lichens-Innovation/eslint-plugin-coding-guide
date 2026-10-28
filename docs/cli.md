# Habit checks CLI (`coding-guide`)

The package also ships `coding-guide`, a pure TypeScript replacement for [habit-hooks](https://github.com/habit-hooks/habit-hooks): no Python, no `uv`, only this devDependency. It runs four sensors, filters their findings through transformers and prints a coaching guide per smell.

| Sensor    | What it reports                                                                       |
| --------- | ------------------------------------------------------------------------------------- |
| `eslint`  | Every message of the project's own ESLint config (rule ids, mapped to smells)         |
| `knip`    | Unused files, exports, dependencies, class members (+ test-only dead code)            |
| `comment` | Own-line comments (`//` ≥ 10 chars, block/JSDoc ≥ 15 chars) — `eslint-disable` exempt |
| `jscpd`   | Duplicated code (project `.jscpd.json`, else `src` with 5 lines / 50 tokens)          |

`eslint` and `typescript` are resolved from your project; `knip` and `jscpd` come with this package.

## Scripts

```json
{
  "scripts": {
    "prepare": "coding-guide hooks install",
    "lint": "coding-guide check",
    "habit:hooks": "coding-guide check --branch main",
    "habit:hooks:full": "coding-guide check",
    "habit:snoozed": "coding-guide snooze --list"
  }
}
```

## Commands

| Command                              | Description                                                                                                                                          |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `coding-guide check`                 | Whole project (tracked + untracked files matching `files`)                                                                                           |
| `coding-guide check --staged`        | Only the files about to be committed (what the pre-commit hook runs)                                                                                 |
| `coding-guide check --branch [base]` | Files changed since the branch left `base` (default `scope.branchBase`), plus work in progress                                                       |
| `coding-guide check --since <ref>`   | Files changed since `ref`, plus work in progress                                                                                                     |
| `coding-guide check --file <path>`   | One file, snooze bypassed                                                                                                                            |
| `coding-guide check --format json`   | Machine-readable findings (for agents and custom tooling)                                                                                            |
| `coding-guide snooze --list`         | Lists snoozed keys                                                                                                                                   |
| `coding-guide snooze --add <key...>` | Snoozes keys (a file path snoozes every finding of that file)                                                                                        |
| `coding-guide snooze --prune`        | Removes keys no longer reported by a full, snooze-free run                                                                                           |
| `coding-guide hooks install`         | Adds `coding-guide check --staged` to `.husky/pre-commit` when husky owns the hooks, else writes `.git/hooks/pre-commit` (idempotent, skipped on CI) |

`eslint` and `comment` only see scoped files; `knip` and `jscpd` analyse the whole project, and outside of the full run only the findings touching scoped files are kept.

Exit codes: `0` clean (or suggested smells only), `1` an enforced smell remains, `2` tool or config error (`incomplete-run`).

## Configuration (`.coding-guide/config.json`)

Every key is optional; unknown keys are rejected.

```json
{
  "$schema": "../node_modules/@lichens-innovation/eslint-plugin-coding-guide/schema/config.schema.json",
  "files": ["**/*.ts", "**/*.tsx", "!**/node_modules/**"],
  "transformers": ["allow-aaa", "snooze", "habit-hooks-disable"],
  "scope": { "branchBase": "main" },
  "sensors": { "jscpd": { "disabled": true }, "comment": { "singleLineMinLength": 10 } },
  "uncoached": "suggest",
  "smells": {
    "coding-guide/todo-ticket-ref": { "severity": "enforced" },
    "my-plugin/my-rule": { "severity": "enforced", "guide": "my-rule" }
  }
}
```

- `smells` are merged over a built-in preset that already declares every `coding-guide/*` rule and the usual ESLint rules with their guide. Severities: `enforced` (blocks), `suggested` (printed, does not block), `disabled`.
- `uncoached` decides what happens to a smell with no severity: `suggest` (default), `ignore` or `enforce`.
- Guides are read from `.coding-guide/guides/<name>.md` first, then from [`docs/habit-hooks-guides/`](habit-hooks-guides/).
- The snooze index lives in `.coding-guide/snooze.json` (a JSON list of keys, usually file paths). An existing `.habit-hooks/snooze.json` can be copied as is.

## Transformers

Built-ins, applied in the configured order:

- `allow-aaa` — keeps `// arrange`, `// act`, `// assert` markers in test files from being reported as comments.
- `snooze` — drops issues whose key is in the snooze index.
- `habit-hooks-disable` (alias `coding-guide-disable`) — drops an issue when its line carries `habit-hooks-disable [smell, ...]` or `coding-guide-disable [smell, ...]`, or when the previous line carries the `-next-line` variant. Without a smell list, every smell is disabled.

A custom transformer is any module default-exporting a function, referenced by a `./relative` path (a `.ts` file works on Node ≥ 24 thanks to type stripping):

```ts
// .coding-guide/transformers/ignore-generated.ts
import { defineTransformer } from "@lichens-innovation/eslint-plugin-coding-guide";

export default defineTransformer((findings) =>
  findings
    .map((finding) => ({ ...finding, issues: finding.issues.filter((issue) => !issue.key.endsWith(".gen.ts")) }))
    .filter((finding) => finding.issues.length > 0)
);
```

```json
{ "transformers": ["allow-aaa", "snooze", "habit-hooks-disable", "./.coding-guide/transformers/ignore-generated.ts"] }
```
