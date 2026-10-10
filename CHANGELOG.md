# [2.1.0](https://github.com/Lichens-Innovation/eslint-plugin-coding-guide/compare/v2.0.0...v2.1.0) (2026-10-10)


### Features

* **no-inline-object-param-type:** flag return types, variables and call type args ([a12f7c4](https://github.com/Lichens-Innovation/eslint-plugin-coding-guide/commit/a12f7c4a0f873a57b9f83e05185c4f8bd111b130))

# [2.0.0](https://github.com/Lichens-Innovation/eslint-plugin-coding-guide/compare/v1.1.0...v2.0.0) (2026-10-08)


* feat!: rules improvements ([#3](https://github.com/Lichens-Innovation/eslint-plugin-coding-guide/issues/3)) ([8405ae5](https://github.com/Lichens-Innovation/eslint-plugin-coding-guide/commit/8405ae587548959a076e941568a89f8d4b8b4619))


### BREAKING CHANGES

* configs.recommended enables every rule as "error", so the 10
new rules (max-files-per-folder, no-bind-this, no-double-negation,
no-inline-await-access, no-mobx-reaction, prefer-antd-flex,
prefer-blank-helpers, prefer-each-table, prefer-get-error-message,
require-aaa-comments) now report errors in consuming projects.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>

* fix(build): externalize node builtins in lib bundle

The lib build replaced node:fs / node:path with empty browser shims, so
max-files-per-folder and prefer-antd-flex crashed at runtime
("k.basename is not a function"). Tests run against src and missed it.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>

* docs(md): rule adjustment

* fix(rules): align messages and autofixes with house rules

- prefer-element-ref-type: suggest ComponentRef (ElementRef is deprecated
  in @types/react); stop mapping HTMLHeadingElement to h1
- prefer-jsx-short-circuit: string guards ask for isNotBlank(x) instead of
  !!x, which prefer-blank-helpers rejects
- no-inline-curried-handler: message no longer pushes stateful factories
  to *.utils.ts
- filename-convention-by-export-shape: drop "root-level" wording, keep
  file extension in suggested name
- share type helpers via utils/type.utils.ts
- fix rule doc examples that violated other house rules

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>

* docs(habit-hooks): sync guides with house rules

Add guides for every house rule missing one, rename ticket-ref to
todo-ticket-ref, and rewrite existing guides against the rule sources
so their triggers, fixes and AVOID notes match actual behaviour and
don't trip other house rules.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>

* fix(build): export rule option types for declaration emit

max-files-per-folder's Options was not exported, so emitting declarations
for the rules map failed with TS4023. Re-export it and no-double-negation's
Options from the entry point, like the other rule option types.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>

* fix(rules): refine blank fallback and test cast reporting

prefer-blank-helpers: when the left side of a string `||` fallback is not
a plain reference (e.g. a call), ask to store it in a local first instead
of suggesting a ternary that evaluates it twice.

no-inline-object-param-type: skip object types inside `as` / `<T>` casts
in test files.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>

# [1.1.0](https://github.com/Lichens-Innovation/eslint-plugin-coding-guide/compare/v1.0.4...v1.1.0) (2026-09-13)


### Features

* **one-component-per-tsx-file:** add rule for single component per .tsx file ([#2](https://github.com/Lichens-Innovation/eslint-plugin-coding-guide/issues/2)) ([eaa2257](https://github.com/Lichens-Innovation/eslint-plugin-coding-guide/commit/eaa225799801d02aa5c1e0b30654279cafde722c))

## [1.0.4](https://github.com/Lichens-Innovation/eslint-plugin-coding-guide/compare/v1.0.3...v1.0.4) (2026-09-13)


### Bug Fixes

* **inline-render:** improve the inline rendering rule ([#1](https://github.com/Lichens-Innovation/eslint-plugin-coding-guide/issues/1)) ([eb70487](https://github.com/Lichens-Innovation/eslint-plugin-coding-guide/commit/eb70487a11204c80d92990b4e916abdddb176576))

## [1.0.3](https://github.com/Lichens-Innovation/eslint-plugin-coding-guide/compare/v1.0.2...v1.0.3) (2026-08-31)


### Bug Fixes

* **ticket-rule:** regex for jira tickets ([a34f07a](https://github.com/Lichens-Innovation/eslint-plugin-coding-guide/commit/a34f07a646c4eb7d80903c2792f957b860eb34ec))

## [1.0.2](https://github.com/Lichens-Innovation/eslint-plugin-coding-guide/compare/v1.0.1...v1.0.2) (2026-08-31)


### Bug Fixes

* **release:** trigger release to publish existing rules on GitHub Packages ([e50fb95](https://github.com/Lichens-Innovation/eslint-plugin-coding-guide/commit/e50fb959134387f420d0895e1ba17f5a57fcbca2))

## [1.0.1](https://github.com/Lichens-Innovation/eslint-plugin-coding-guide/compare/v1.0.0...v1.0.1) (2026-08-30)


### Bug Fixes

* **coverage:** coverage fix ([d161779](https://github.com/Lichens-Innovation/eslint-plugin-coding-guide/commit/d1617796ef49c9c43863b5e519294ca425eece61))
