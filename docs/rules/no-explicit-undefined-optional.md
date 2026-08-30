# coding-guide/no-explicit-undefined-optional

Disallows an explicit `| undefined` where the `?` optional-modifier syntax is available: function/method parameters, interface & type-literal properties, class fields, and constructor parameter properties. Variable/return types are left untouched since they have no `?` equivalent. Auto-fixable.

## ❌ Incorrect

```ts
function f(a: string | undefined) {}

interface Foo {
  a: string | undefined;
}
```

## ✅ Correct

```ts
function f(a?: string) {}

interface Foo {
  a?: string;
}
```

## Options

This rule has no options.
