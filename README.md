# eslint-plugin-coding-guide

ESLint flat-config plugin enforcing Lichens Innovation TypeScript/React coding standards.

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![ESLint](https://img.shields.io/badge/ESLint-10-4B32C3.svg?style=flat-square&logo=eslint)](https://eslint.org/)
[![Vitest](https://img.shields.io/badge/Vitest-4.1-6E9F18.svg?style=flat-square&logo=vitest)](https://vitest.dev/)
[![Bun](https://img.shields.io/badge/Bun-1.4+-000000.svg?style=flat-square&logo=bun)](https://bun.sh/)

- [eslint-plugin-coding-guide](#eslint-plugin-coding-guide)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Rules](#rules)
  - [Habit checks CLI (`coding-guide`)](#habit-checks-cli-coding-guide)
  - [Adopting in an existing project](#adopting-in-an-existing-project)
  - [Development](#development)
  - [All Scripts](#all-scripts)
  - [Contributions](#contributions)
  - [Library semantic versioning](#library-semantic-versioning)
  - [References](#references)
  - [License](#license)

## Installation

```bash
npm install --save-dev @lichens-innovation/eslint-plugin-coding-guide
```

Peer dependency: `eslint >= 9.0.0` (flat config only).

## Usage

```js
// eslint.config.js
import codingGuide from "@lichens-innovation/eslint-plugin-coding-guide";

export default [
  codingGuide.configs.recommended,
  // ...your other config objects
];
```

Each rule can also be enabled individually via `codingGuide.rules["<rule-name>"]` under your own plugin key.

## Rules

All rules live under the `coding-guide/` namespace and are enabled by `configs.recommended`. See the [rules list](https://github.com/Lichens-Innovation/eslint-plugin-coding-guide/blob/main/docs/rules/README.md) for the full table and a page per rule.

## Habit checks CLI (`coding-guide`)

The package also ships `coding-guide`, a pure TypeScript replacement for [habit-hooks](https://github.com/habit-hooks/habit-hooks): no Python, no `uv`, only this devDependency. It runs four sensors, filters their findings through transformers and prints a coaching guide per smell.

| Sensor    | What it reports                                                                       |
| --------- | ------------------------------------------------------------------------------------- |
| `eslint`  | Every message of the project's own ESLint config (rule ids, mapped to smells)         |
| `knip`    | Unused files, exports, dependencies, class members (+ test-only dead code)            |
| `comment` | Own-line comments (`//` ≥ 10 chars, block/JSDoc ≥ 15 chars) — `eslint-disable` exempt |
| `jscpd`   | Duplicated code (project `.jscpd.json`, else `src` with 5 lines / 50 tokens)          |

`eslint` and `typescript` are resolved from your project; `knip` and `jscpd` come with this package.

### Scripts

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

### Commands

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

### Configuration (`.coding-guide/config.json`)

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
- Guides are read from `.coding-guide/guides/<name>.md` first, then from [`docs/habit-hooks-guides/`](docs/habit-hooks-guides/).
- The snooze index lives in `.coding-guide/snooze.json` (a JSON list of keys, usually file paths). An existing `.habit-hooks/snooze.json` can be copied as is.

### Transformers

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

## Adopting in an existing project

The [adoption guide](https://github.com/Lichens-Innovation/eslint-plugin-coding-guide/blob/main/docs/adoption-guide.md) covers integrating the plugin and the CLI into an existing codebase, mitigating the first-run findings (ignores, snooze, `suggested` severities) and tightening the standard progressively.

## Development

Install [Bun](https://bun.sh/docs/installation) 1.4+ (see `packageManager` in `package.json`), then:

```bash
bun install
```

## All Scripts

| Command                | Description                                                             |
| ---------------------- | ----------------------------------------------------------------------- |
| `bun prepare`          | Installs husky git hooks (runs on `bun install`)                        |
| `bun typecheck`        | Checks TypeScript types without emitting files                          |
| `bun lint`             | Runs ESLint to check code quality                                       |
| `bun lint:fix`         | Runs ESLint with `--fix`                                                |
| `bun lint:package`     | Lints `package.json` via npm-package-json-lint                          |
| `bun lint:unused`      | Finds unused files, exports, and dependencies (via knip)                |
| `bun format`           | Formats all files using Prettier according to .prettierrc rules         |
| `bun format:check`     | Checks if files are formatted according to Prettier rules               |
| `bun build`            | Cleans `dist`, then Vite library build (`src/index.ts` + CLI → `dist/`) |
| `bun test`             | Runs tests using Vitest                                                 |
| `bun test:coverage`    | Runs tests with a Vitest coverage report                                |
| `bun habit:hooks`      | Runs this package's own `coding-guide check --branch main` from source  |
| `bun habit:hooks:full` | Runs `coding-guide check` on the whole repo from source                 |
| `bun habit:snoozed`    | Lists snoozed keys                                                      |

## Contributions

Contributions to the project are made by improving the current codebase and then creating a Pull Request. Every PR runs the CI workflow (lint, typecheck, test, build). When the PR is merged into `main`, the release CI pipeline runs automatically. [semantic-release](https://semantic-release.gitbook.io/) determines the next version from conventional commit messages, updates `CHANGELOG.md` and `package.json`, and publishes the new version — no manual version bump required.

## Library semantic versioning

Versioning is automated by [semantic-release](https://semantic-release.gitbook.io/) using [Conventional Commits](https://www.conventionalcommits.org/). The release type is derived from commit message prefixes:

| Commit prefix                 | Release type                                    |
| ----------------------------- | ----------------------------------------------- |
| `fix:`                        | `PATCH` — backward-compatible bug fix           |
| `feat:`                       | `MINOR` — new backward-compatible functionality |
| `feat!:` / `BREAKING CHANGE:` | `MAJOR` — incompatible API change               |

Follow [Semantic Versioning](https://semver.org/#summary) (`MAJOR.MINOR.PATCH`) when writing commit messages — the tooling takes care of the rest. Commitlint requires a **scope** (e.g. `feat(rules): add no-foo-bar`).

## References

- [Habit-hooks](https://github.com/habit-hooks/habit-hooks) — the `coding-guide` CLI ports its pipeline; the generic smell guides in `docs/habit-hooks-guides/` (e.g. `unused-export.md`, `duplicated-code.md`) come from habit-hooks, MIT License, Copyright (c) 2026 Ivett Ördög.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
