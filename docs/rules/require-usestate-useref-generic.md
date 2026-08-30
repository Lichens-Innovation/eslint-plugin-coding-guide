# coding-guide/require-usestate-useref-generic

Requires an explicit type argument on `useState()`/`useRef()` when the initial value can't infer a useful type on its own (no argument, or a bare `null`/`undefined`).

## ❌ Incorrect

```tsx
const [user, setUser] = useState(null);
const ref = useRef();
```

## ✅ Correct

```tsx
const [user, setUser] = useState<User | null>(null);
const ref = useRef<HTMLDivElement>(null);
```

## Options

This rule has no options.
