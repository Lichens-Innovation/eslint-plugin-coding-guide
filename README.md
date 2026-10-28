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

The package also ships `coding-guide`, a pure TypeScript replacement for [habit-hooks](https://github.com/habit-hooks/habit-hooks): no Python, no `uv`, only this devDependency. It runs four sensors (`eslint`, `knip`, `comment`, `jscpd`), filters their findings through transformers and prints a coaching guide per smell. See the [CLI documentation](https://github.com/Lichens-Innovation/eslint-plugin-coding-guide/blob/main/docs/cli.md) for scripts, commands, configuration and transformers.

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
