# coding-guide/no-nested-try

Disallows a `try` statement nested inside another `try` block or `catch` handler of the same function — flatten into one `try`/`catch` that handles both error paths.

## ❌ Incorrect

```ts
try {
  try {
    a();
  } catch (e) {
    b();
  }
} catch (e2) {
  c();
}
```

## ✅ Correct

```ts
try {
  a();
  b();
} catch (e) {
  c();
}
```

## Options

This rule has no options.
