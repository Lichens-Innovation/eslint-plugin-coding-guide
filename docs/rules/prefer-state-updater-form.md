# coding-guide/prefer-state-updater-form

Disallows `setX(expr)` where `expr` references the paired state variable directly instead of using the updater-function form `setX((current) => ...)` — avoids stale-closure bugs when multiple updates batch together.

## ❌ Incorrect

```tsx
setCount(count + 1);
```

## ✅ Correct

```tsx
setCount((current) => current + 1);
```

## Options

This rule has no options.
