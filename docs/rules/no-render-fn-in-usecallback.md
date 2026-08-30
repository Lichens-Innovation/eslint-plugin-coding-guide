# coding-guide/no-render-fn-in-usecallback

Disallows wrapping a JSX-returning (or `render*`-named) function in `useCallback` — extract a subcomponent instead, and reserve `useCallback` for actual event-handler functions.

## ❌ Incorrect

```tsx
const renderHeader = useCallback(() => <div />, []);
```

## ✅ Correct

```tsx
function Header() {
  return <div />;
}
```

## Options

This rule has no options.
