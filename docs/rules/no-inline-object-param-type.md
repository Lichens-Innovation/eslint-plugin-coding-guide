# coding-guide/no-inline-object-param-type

Disallows an inline object-literal type annotation on a function parameter (`({ a, b }: { a: string; b: number }) => ...`) — extract a named `interface` above the function instead.

## ❌ Incorrect

```ts
function f({ a, b }: { a: string; b: number }) {}
```

## ✅ Correct

```ts
interface FArgs {
  a: string;
  b: number;
}

function f({ a, b }: FArgs) {}
```

## Options

This rule has no options.
