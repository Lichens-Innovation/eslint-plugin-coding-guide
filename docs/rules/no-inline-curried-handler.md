# coding-guide/no-inline-curried-handler

Disallows declaring a curried handler factory (`(id) => () => fn(id)`) as a local variable inside a component. Move pure factories to a `*.utils.ts` file; keep inline arrows to one-liners.

## ❌ Incorrect

```tsx
function Widget() {
  const makeHandler = (id) => () => doThing(id);
  return null;
}
```

## ✅ Correct

```ts
// widget.utils.ts
export const makeHandler = (id) => () => doThing(id);
```

## Options

This rule has no options.
