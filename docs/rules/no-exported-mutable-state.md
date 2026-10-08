# coding-guide/no-exported-mutable-state

Disallows `export let` / `export var` at module scope — a mutable exported binding lets any importer silently mutate shared state from outside the module.

## ❌ Incorrect

```ts
export let counter = 0;
```

## ✅ Correct

```ts
// never reassigned: make it a const
export const MAX_RETRIES = 3;
```

```ts
// genuinely mutable: keep the binding private and expose functions that own the mutation
let counter = 0;

export const getCounter = () => counter;
export const incrementCounter = () => {
  counter += 1;
};
```

Exporting a `const` object (`export const counter = { value: 0 }`) passes this rule but is not a fix: importers can still mutate `counter.value` from anywhere.

## Options

This rule has no options.
