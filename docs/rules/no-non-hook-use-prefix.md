# coding-guide/no-non-hook-use-prefix

Disallows naming a function `use[A-Z]...` when its body calls no hook — a plain function should have an action-verb name, not a hook name that promises React hook semantics (rules-of-hooks lint coverage, etc.) it doesn't need.

## ❌ Incorrect

```ts
function useCounter() {
  return 0;
}
```

## ✅ Correct

```ts
function useCounter() {
  return useState(0);
}

function getInitialCount() {
  return 0;
}
```

## Options

This rule has no options.
