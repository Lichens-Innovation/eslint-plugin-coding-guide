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
  - [Development](#development)
  - [All Scripts](#all-scripts)
  - [Contributions](#contributions)
  - [Library semantic versioning](#library-semantic-versioning)
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

All rules live under the `coding-guide/` namespace and are enabled by `configs.recommended`. See `docs/rules/<name>.md` for details on each.

| Rule                                                                                             | Description                                                                                      |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| [`filename-convention-by-export-shape`](docs/rules/filename-convention-by-export-shape.md)       | Enforce filename conventions against a file's exported shape                                     |
| [`hoist-static-component-constants`](docs/rules/hoist-static-component-constants.md)             | Disallow a static array/object literal declared inside a component body                          |
| [`max-params-project`](docs/rules/max-params-project.md)                                         | Enforce a maximum number of parameters on project-owned functions                                |
| [`no-explicit-undefined-optional`](docs/rules/no-explicit-undefined-optional.md)                 | Use `?` instead of an explicit `\| undefined` on params/properties that support it               |
| [`no-exported-mutable-state`](docs/rules/no-exported-mutable-state.md)                           | Disallow exporting a mutable (let/var) module-scoped binding                                     |
| [`no-hook-returning-jsx`](docs/rules/no-hook-returning-jsx.md)                                   | Disallow a use* hook returning JSX                                                               |
| [`no-inline-array-chain-in-jsx`](docs/rules/no-inline-array-chain-in-jsx.md)                     | Disallow chained array methods directly inside a JSX expression                                  |
| [`no-inline-curried-handler`](docs/rules/no-inline-curried-handler.md)                           | Disallow a curried handler factory declared as a local component variable                        |
| [`no-inline-guard-chain-handler`](docs/rules/no-inline-guard-chain-handler.md)                   | Disallow a JSX prop arrow whose body is a long `&&` guard chain                                  |
| [`no-inline-object-param-type`](docs/rules/no-inline-object-param-type.md)                       | Disallow inline object type literals on function parameters                                      |
| [`no-inline-render-function`](docs/rules/no-inline-render-function.md)                           | Disallow calling a locally-declared render* helper function from within JSX                      |
| [`no-jsx-in-variable`](docs/rules/no-jsx-in-variable.md)                                         | Disallow storing a JSX element/fragment in a variable                                            |
| [`no-nested-try`](docs/rules/no-nested-try.md)                                                   | Disallow nesting a try statement inside another try block or catch handler                       |
| [`no-non-hook-use-prefix`](docs/rules/no-non-hook-use-prefix.md)                                 | Disallow a use* named function whose body calls no hook                                          |
| [`no-render-fn-in-usecallback`](docs/rules/no-render-fn-in-usecallback.md)                       | Disallow useCallback wrapping a JSX-returning or render*-named function                          |
| [`no-tests-in-dunder-folder`](docs/rules/no-tests-in-dunder-folder.md)                           | Disallow test files inside a `__tests__` folder                                                  |
| [`no-trivial-usememo`](docs/rules/no-trivial-usememo.md)                                         | Disallow useMemo whose body has no function call (likely unnecessary memoization)                |
| [`no-unguarded-json-parse`](docs/rules/no-unguarded-json-parse.md)                               | Require `JSON.parse(...)` to be wrapped in a try/catch                                           |
| [`prefer-element-ref-type`](docs/rules/prefer-element-ref-type.md)                               | Prefer `useRef<ElementRef<"tag">>(null)` over a raw `HTMLXxxElement` type argument               |
| [`prefer-includes-over-or-chain`](docs/rules/prefer-includes-over-or-chain.md)                   | Prefer `Array#includes` over a chain of `===` comparisons against the same value                 |
| [`prefer-jsx-short-circuit`](docs/rules/prefer-jsx-short-circuit.md)                             | Prefer `&&` short-circuit for optional JSX, with a boolean left side                             |
| [`prefer-nullish-helpers`](docs/rules/prefer-nullish-helpers.md)                                 | Prefer `isNullish`/`!isNullish` over a manual null-and-undefined comparison pair                 |
| [`prefer-positive-condition`](docs/rules/prefer-positive-condition.md)                           | Prefer a positive condition in a ternary over a negated one with swapped branches                |
| [`prefer-props-with-children`](docs/rules/prefer-props-with-children.md)                         | Prefer `PropsWithChildren<Props>` over a hand-declared `children` property                       |
| [`prefer-reactnode-over-jsxelement-union`](docs/rules/prefer-reactnode-over-jsxelement-union.md) | Prefer `ReactNode` over a `JSX.Element \| null \| undefined` union                               |
| [`prefer-role-query-over-testid`](docs/rules/prefer-role-query-over-testid.md)                   | Prefer Testing Library's `*ByRole` queries over `*ByTestId`                                      |
| [`prefer-some-over-find-check`](docs/rules/prefer-some-over-find-check.md)                       | Prefer `Array#some` over comparing `Array#find`'s result to undefined                            |
| [`prefer-state-updater-form`](docs/rules/prefer-state-updater-form.md)                           | Prefer the updater-function form of a state setter when the new value depends on the current one |
| [`require-effect-cleanup`](docs/rules/require-effect-cleanup.md)                                 | Require a cleanup return from a `useEffect` that registers a timer/listener/subscription         |
| [`require-fallback-on-deep-chain`](docs/rules/require-fallback-on-deep-chain.md)                 | Require a `??` fallback on a deep optional chain                                                 |
| [`require-numeric-enum-initializer`](docs/rules/require-numeric-enum-initializer.md)             | Require an explicit initializer on every enum member                                             |
| [`require-usestate-useref-generic`](docs/rules/require-usestate-useref-generic.md)               | Require an explicit generic on `useState()`/`useRef()` when the initial value can't infer one    |
| [`todo-ticket-ref`](docs/rules/todo-ticket-ref.md)                                               | Require a ticket reference in the TODO comment                                                   |

## Development

Install [Bun](https://bun.sh/docs/installation) 1.4+ (see `packageManager` in `package.json`), then:

```bash
bun install
```

## All Scripts

| Command             | Description                                                       |
| ------------------- | ----------------------------------------------------------------- |
| `bun prepare`       | Installs husky git hooks (runs on `bun install`)                  |
| `bun typecheck`     | Checks TypeScript types without emitting files                    |
| `bun lint`          | Runs ESLint to check code quality                                 |
| `bun lint:fix`      | Runs ESLint with `--fix`                                          |
| `bun lint:package`  | Lints `package.json` via npm-package-json-lint                    |
| `bun lint:unused`   | Finds unused files, exports, and dependencies (via knip)          |
| `bun format`        | Formats all files using Prettier according to .prettierrc rules   |
| `bun format:check`  | Checks if files are formatted according to Prettier rules         |
| `bun build`         | Cleans `dist`, then Vite library build (`src/index.ts` → `dist/`) |
| `bun test`          | Runs tests using Vitest                                           |
| `bun test:coverage` | Runs tests with a Vitest coverage report                          |

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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
