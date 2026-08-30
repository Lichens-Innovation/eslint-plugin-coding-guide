# coding-guide/prefer-positive-condition

Disallows a ternary whose test is a negated expression (`!cond ? a : b`) — swap the branches and drop the negation so the condition reads positive-first. Auto-fixable.

## ❌ Incorrect

```tsx
const label = !isOpen ? "Closed" : "Open";
```

## ✅ Correct

```tsx
const label = isOpen ? "Open" : "Closed";
```

## Options

This rule has no options.
