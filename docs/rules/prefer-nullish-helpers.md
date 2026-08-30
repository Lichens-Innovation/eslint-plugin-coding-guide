# coding-guide/prefer-nullish-helpers

Disallows a manual `x !== null && x !== undefined` / `x === null || x === undefined` comparison pair against the same expression — prefer the `isNullish`/`isNotBlank`-style helpers from `@lichens-innovation/ts-common`.

## ❌ Incorrect

```tsx
if (value !== null && value !== undefined) {
  use(value);
}
```

## ✅ Correct

```tsx
if (!isNullish(value)) {
  use(value);
}
```

## Options

This rule has no options.
