# Adopting coding-guide in an existing project

How to add `@lichens-innovation/eslint-plugin-coding-guide` (ESLint rules + `coding-guide` CLI) to a codebase that was not written against it, without a big-bang refactor. The steps below come from two real integrations: a Vite web app and an Expo mobile app.

- [Adopting coding-guide in an existing project](#adopting-coding-guide-in-an-existing-project)
  - [1. Integrate](#1-integrate)
  - [2. Mitigate the first-run impact](#2-mitigate-the-first-run-impact)
  - [3. Improve the codebase progressively](#3-improve-the-codebase-progressively)

## 1. Integrate

1. Install the devDependency:

   ```bash
   bun add -d @lichens-innovation/eslint-plugin-coding-guide
   ```

2. Wire the rules into your ESLint flat config, and keep generated code out of it from day one:

   ```js
   // eslint.config.js
   import codingGuide, { configs as codingGuideConfigs } from "@lichens-innovation/eslint-plugin-coding-guide";
   import { globalIgnores } from "eslint/config";

   export default tseslint.config(globalIgnores(["dist", "src/api/generated/**", "src/routeTree.gen.ts"]), {
     files: ["**/*.{ts,tsx}"],
     plugins: { "coding-guide": codingGuide },
     rules: {
       ...codingGuideConfigs.recommended.rules,
       // ...your own rules
     },
   });
   ```

3. Add `.coding-guide/config.json` (the `$schema` path is relative to the `.coding-guide/` folder):

   ```json
   {
     "$schema": "../node_modules/@lichens-innovation/eslint-plugin-coding-guide/schema/config.schema.json",
     "transformers": ["allow-aaa", "snooze", "habit-hooks-disable"]
   }
   ```

4. Add the scripts:

   ```json
   {
     "scripts": {
       "lint": "coding-guide check",
       "lint:ci": "eslint",
       "lint:unused": "knip",
       "habit:hooks": "coding-guide check --branch main",
       "habit:hooks:full": "coding-guide check",
       "habit:snoozed": "coding-guide snooze --list"
     }
   }
   ```

5. Gate commits. With husky, add one line to `.husky/pre-commit` (after typecheck / lint-staged):

   ```sh
   bunx coding-guide check --staged
   ```

   Without husky, `coding-guide hooks install` (e.g. as the `prepare` script) writes the hook for you.

6. Add a `knip.json` if the project has generated files, CLI-only dependencies or binaries knip can't resolve (see [mitigation](#2-mitigate-the-first-run-impact)).

7. Measure the baseline before fixing anything:

   ```bash
   bunx coding-guide check                 # human-readable, grouped by smell
   bunx coding-guide check --format json   # countable, for tooling
   ```

## 2. Mitigate the first-run impact

A legacy codebase usually produces hundreds of findings on the first full run. Don't fix them all, and don't turn the tool off: narrow the scope, from the most targeted lever to the broadest.

| Lever                                                  | Where                       | Use for                                                              |
| ------------------------------------------------------ | --------------------------- | -------------------------------------------------------------------- |
| `globalIgnores([...])`                                 | ESLint config               | Generated code, vendored UI libraries (e.g. shadcn), build output    |
| `ignore`, `ignoreDependencies`, `ignoreBinaries`       | `knip.json`                 | Generated files, deps used only by CLI/build tooling, shell binaries |
| Per-file override (`{ files, rules: { x: "off" } }`)   | ESLint config               | A path that legitimately breaks a rule (e.g. the env-reading util)   |
| `coding-guide snooze --add <file>`                     | `.coding-guide/snooze.json` | Legacy files, native bridges, files you will refactor later          |
| `"smells": { "<smell>": { "severity": "suggested" } }` | `.coding-guide/config.json` | A smell too frequent to block on yet: printed, but does not fail     |
| `"smells": { "<smell>": { "severity": "disabled" } }`  | `.coding-guide/config.json` | A smell that does not apply to this project at all                   |
| `"uncoached": "ignore"`                                | `.coding-guide/config.json` | Third-party ESLint rules with no coaching guide                      |
| `"sensors": { "jscpd": { "disabled": true } }`         | `.coding-guide/config.json` | A whole sensor too noisy for now (duplication is a common one)       |
| `// coding-guide-disable-next-line <smell>`            | Source line                 | One justified exception, visible in review                           |

Smell ids are either an ESLint rule id (`coding-guide/no-jsx-in-variable`, `sonarjs/cognitive-complexity`) or a catalogue name that several rules map to (`oversized-function`, `too-many-parameters`, `unused-export`, `duplicated-code`, ...). The id is printed with every finding.

> An ESLint `"warn"` does **not** make a finding non-blocking: the CLI reports every ESLint message. Blocking is decided only by the smell `severity` in `.coding-guide/config.json`.

A "soft start" config for a heavy codebase can look like this:

```json
{
  "$schema": "../node_modules/@lichens-innovation/eslint-plugin-coding-guide/schema/config.schema.json",
  "transformers": ["allow-aaa", "snooze", "habit-hooks-disable"],
  "sensors": { "jscpd": { "disabled": true } },
  "uncoached": "ignore",
  "smells": {
    "oversized-function": { "severity": "suggested" },
    "oversized-file": { "severity": "suggested" },
    "unused-export": { "severity": "suggested" },
    "coding-guide/max-files-per-folder": { "severity": "suggested" },
    "coding-guide/filename-convention-by-export-shape": { "severity": "suggested" }
  }
}
```

And the matching `knip.json`:

```json
{
  "$schema": "https://unpkg.com/knip@6/schema.json",
  "ignore": ["src/constants.ts", "src/generated/**"],
  "ignoreDependencies": ["@expo/vector-icons"],
  "ignoreBinaries": ["eas", "pod"]
}
```

In practice, the web app needed only 2 snoozed files (generated router tree, `vite-env.d.ts`); the mobile app snoozed 20 (generated protobuf types, native module bridges, a 3D scene manager slated for refactoring).

## 3. Improve the codebase progressively

The pre-commit hook only checks staged files, so the old code never blocks anyone: every file a developer touches must leave clean, everything else waits. Tighten in phases.

| Phase            | Goal                                  | Actions                                                                                                                                                     |
| ---------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0 Baseline**  | New code is clean, old code untouched | Ignore generated code, snooze legacy files, set noisy smells to `suggested`, gate with `check --staged`                                                     |
| **P1 Boy scout** | Every touched file gets better        | Fix the findings of the files you edit; run `habit:hooks` (`--branch main`) before opening a PR; run `coding-guide snooze --prune` to drop keys that healed |
| **P2 Ratchet**   | Turn suggestions into rules           | Count findings per smell (`--format json`); once a `suggested` smell is near zero, fix the rest and flip it to `enforced` — one smell per PR                |
| **P3 Full**      | Whole project held to the standard    | Re-enable disabled sensors (jscpd), shrink knip `ignore`, empty the snooze list, run `habit:hooks:full` in CI                                               |

Rules of thumb:

- The snooze list only shrinks. Adding a key is a review topic, not a reflex.
- Prefer `suggested` over `disabled`: suggestions stay visible and keep the count honest.
- Prefer a per-file override or snooze over a project-wide `disabled`: the blast radius stays small.
- Refactor one smell at a time across the codebase rather than one file across every smell; the guides (`docs/habit-hooks-guides/`, `docs/rules/`) then teach one habit at a time.
