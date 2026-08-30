# coding-guide/hoist-static-component-constants

Disallows a `const` array/object literal declared inside a component or hook body that has no dependency on the component's own scope (props, state, closures) — it gets recreated on every render for no reason. Hoist it to module scope instead.

## ❌ Incorrect

```tsx
function Widget() {
  const options = ["a", "b"];
  return options;
}
```

## ✅ Correct

```tsx
const OPTIONS = ["a", "b"];

function Widget() {
  return OPTIONS;
}
```

## Options

This rule has no options.
