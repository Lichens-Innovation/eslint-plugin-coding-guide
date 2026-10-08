# coding-guide/prefer-each-table

Prefers the tagged-template table form of `it.each` / `test.each` / `describe.each` over an array of tuples. Named columns make each case readable at a glance and give the test title meaningful `$name` interpolations instead of positional `%s`.

Applies to any chain rooted at `it`, `test` or `describe` (e.g. `it.only.each`, `test.concurrent.each`). Only arrays whose rows are all arrays are reported — arrays of primitives or objects are left alone.

## ❌ Incorrect

```ts
it.each([
  ["PROGRESS: 0", 0],
  ["PROGRESS: 42", 42],
  ["PROGRESS: 100", 100],
  ["[info] PROGRESS:7 frames", 7],
])("reads %s", (line, expected) => {
  expect(parseConversionProgress(line)).toBe(expected);
});
```

## ✅ Correct

```ts
it.each`
  line                          | expected
  ${"PROGRESS: 0"}              | ${0}
  ${"PROGRESS: 42"}             | ${42}
  ${"PROGRESS: 100"}            | ${100}
  ${"[info] PROGRESS:7 frames"} | ${7}
`("reads $line", ({ line, expected }) => {
  expect(parseConversionProgress(line)).toBe(expected);
});
```

## Autofix

The rule autofixes when the conversion is unambiguous: column names are taken from the callback parameters, positional placeholders (`%s`, `%d`, `%i`, `%f`, `%j`, `%o`, `%p`) in the title become `$name`, and parameters become a destructured object. No fix is offered when parameters are typed or non-identifiers, rows have different lengths or spreads, the title uses `%#` or escapes, or the title is not a string literal.

## Options

This rule has no options.
