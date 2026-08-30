# coding-guide/no-tests-in-dunder-folder

Disallows test files living inside a `__tests__` folder — colocate `*.test.ts(x)` next to the source file instead, so the test travels with the code it covers.

## ❌ Incorrect

```
src/__tests__/widget.test.ts
```

## ✅ Correct

```
src/widget.test.ts
```

## Options

This rule has no options.
