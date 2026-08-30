# coding-guide/no-trivial-usememo

Disallows `useMemo` around a body with no function call inside — memoizing a primitive/trivial expression costs more (the memo machinery itself) than just recomputing it on every render.

## ❌ Incorrect

```ts
const sum = useMemo(() => a + b, [a, b]);
```

## ✅ Correct

```ts
const sum = a + b;

const result = useMemo(() => computeExpensiveThing(a, b), [a, b]);
```

## Options

This rule has no options.
