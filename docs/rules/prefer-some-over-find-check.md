# coding-guide/prefer-some-over-find-check

Disallows `.find(cb) !== undefined` / `.find(cb) === undefined` / `!arr.find(cb)` existence checks — `.some(cb)` says the same thing without allocating/keeping the found element only to discard it. Auto-fixable.

## ❌ Incorrect

```tsx
const hasMatch = items.find((item) => item.id === id) !== undefined;
```

## ✅ Correct

```tsx
const hasMatch = items.some((item) => item.id === id);
```

## Options

This rule has no options.
