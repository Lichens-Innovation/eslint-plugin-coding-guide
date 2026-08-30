# coding-guide/prefer-element-ref-type

Prefers `useRef<ElementRef<"tag">>(null)` over a raw `HTMLXxxElement` type argument, so the DOM type stays derived from the JSX tag name instead of hand-picked. Auto-fixable when `ElementRef` is already imported from `"react"` in the file.

## ❌ Incorrect

```tsx
const ref = useRef<HTMLDivElement>(null);
```

## ✅ Correct

```tsx
import type { ElementRef } from "react";

const ref = useRef<ElementRef<"div">>(null);
```

## Options

This rule has no options.
