# coding-guide/require-effect-cleanup

Requires a `useEffect` that registers an interval/timeout/listener/subscription to return a cleanup function that tears it down.

## ❌ Incorrect

```tsx
useEffect(() => {
  window.addEventListener("resize", onResize);
}, []);
```

## ✅ Correct

```tsx
useEffect(() => {
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize);
}, []);
```

## Options

This rule has no options.
