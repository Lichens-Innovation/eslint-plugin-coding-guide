# coding-guide/no-unguarded-json-parse

Requires `JSON.parse(...)` to be wrapped in a `try`/`catch`. Malformed input makes `JSON.parse` throw, and an uncaught throw should never be allowed to escape from a boundary that only expects to be handed data.

## ❌ Incorrect

```tsx
const data = JSON.parse(raw);
```

## ✅ Correct

```tsx
try {
  const data = JSON.parse(raw);
} catch (error) {
  console.error(error);
}
```

## Options

This rule has no options.
