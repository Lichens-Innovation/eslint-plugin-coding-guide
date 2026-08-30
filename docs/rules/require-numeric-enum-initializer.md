# coding-guide/require-numeric-enum-initializer

Requires every enum member to have an explicit initializer, instead of relying on implicit auto-incrementing ordinals (`enum Foo { A, B }`). String enum members already require an initializer at the TS level, so this only ever fires on numeric/computed members.

## ❌ Incorrect

```tsx
enum Status {
  Active,
  Inactive,
}
```

## ✅ Correct

```tsx
enum Status {
  Active = 1,
  Inactive = 2,
}
```

## Options

This rule has no options.
