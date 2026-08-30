# coding-guide/prefer-includes-over-or-chain

Prefers `Array#includes` over a chain of `===`/`==` comparisons repeated against the same left-hand side. Auto-fixable.

## ❌ Incorrect

```tsx
if (status === "open" || status === "pending" || status === "in-review") {
  // ...
}
```

## ✅ Correct

```tsx
if (["open", "pending", "in-review"].includes(status)) {
  // ...
}
```

## Options

This rule has no options.
