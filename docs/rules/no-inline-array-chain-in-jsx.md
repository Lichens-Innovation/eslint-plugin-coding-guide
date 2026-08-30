# coding-guide/no-inline-array-chain-in-jsx

Disallows chaining 2 or more array methods (`filter`/`sort`/`map`/`reduce`) directly inside a JSX expression container — precompute the list with an imported helper instead, so the render body stays declarative and the derivation is testable on its own.

## ❌ Incorrect

```tsx
<div>{items.filter((item) => item.active).map((item) => item.name)}</div>
```

## ✅ Correct

```tsx
const activeNames = getActiveItemNames(items);

<div>{activeNames}</div>;
```

## Options

This rule has no options.
