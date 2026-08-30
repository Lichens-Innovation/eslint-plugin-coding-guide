# coding-guide/require-fallback-on-deep-chain

Requires a `?? fallback` after an optional-chain expression that is at least `minDepth` `?.` segments deep — a long dangling optional chain with no fallback usually means an implicit `undefined` leaks further than intended.

## ❌ Incorrect

```tsx
const city = user?.address?.location?.city;
```

## ✅ Correct

```tsx
const city = user?.address?.location?.city ?? "Unknown";
```

## Options

| Option     | Type     | Default | Description                                                                          |
| ---------- | -------- | ------- | ------------------------------------------------------------------------------------ |
| `minDepth` | `number` | `3`     | Minimum number of `?.`/optional-call segments before a missing fallback is reported. |
