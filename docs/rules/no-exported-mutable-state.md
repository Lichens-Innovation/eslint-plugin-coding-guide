# coding-guide/no-exported-mutable-state

Disallows `export let` / `export var` at module scope — a mutable exported binding lets any importer silently mutate shared state from outside the module.

## ❌ Incorrect

```ts
export let counter = 0;
```

## ✅ Correct

```ts
export const counter = { value: 0 };
// or expose a getter/setter pair instead of the raw binding
```

## Options

This rule has no options.
