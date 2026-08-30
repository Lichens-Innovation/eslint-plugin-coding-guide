# coding-guide/no-jsx-in-variable

Disallows assigning a JSX element/fragment to a variable and injecting it into the return later — declare a small named component instead, so it gets its own props and can be reasoned about independently.

## ❌ Incorrect

```tsx
const el = <div />;
```

## ✅ Correct

```tsx
const Widget = () => <div />;
```

## Options

This rule has no options.
