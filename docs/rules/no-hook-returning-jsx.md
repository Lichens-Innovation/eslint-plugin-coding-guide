# coding-guide/no-hook-returning-jsx

Disallows a `use[A-Z]...`-named hook returning JSX directly — a hook should return data; the calling component should own rendering.

## ❌ Incorrect

```tsx
function useWidget() {
  return <div />;
}
```

## ✅ Correct

```tsx
function useWidget() {
  return { label: "hi" };
}

function Widget() {
  const { label } = useWidget();
  return <div>{label}</div>;
}
```

## Options

This rule has no options.
