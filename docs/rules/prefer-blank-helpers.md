# coding-guide/prefer-blank-helpers

Strings have three distinct "empty" states — `null`/`undefined`, `""`, and whitespace-only (`"  "`). Manual checks (`=== ""`, `.trim().length === 0`, `!value`, `value || fallback`) each cover a different subset of them, so the intent is ambiguous. Prefer the `isBlank`/`isNotBlank` helpers from `@lichens-innovation/ts-common`, which treat all of them as blank.

Truthiness (`!value`, `!!value`), `.length` and `||` checks are only reported when the operand is typed as a string (optionally `| null | undefined`), so this rule needs type information (`parserOptions.projectService`) to report them. `=== ""` and `.trim()` checks are reported without type information.

For `||`, when the left side is not a plain identifier or property chain (e.g. a function call), the message asks to store it in a local variable first so it isn't evaluated twice.

`??` is not reported: it only replaces `null`/`undefined` and deliberately keeps `""`.

## ❌ Incorrect

```ts
if (value === "") {
}
if (value.trim().length === 0) {
}
if (!value) {
} // value: string | undefined
const version = newVersion || currentVersion; // newVersion: string
const cell = formatDate(date) || "—";
```

## ✅ Correct

```ts
if (isBlank(value)) {
}
if (isNotBlank(value)) {
}
const version = isBlank(newVersion) ? currentVersion : newVersion;
const formattedDate = formatDate(date);
const cell = isBlank(formattedDate) ? "—" : formattedDate;
const label = value ?? "default"; // keeps "" on purpose
```

## Options

This rule has no options.
