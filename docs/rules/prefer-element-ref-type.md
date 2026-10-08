# coding-guide/prefer-element-ref-type

Prefers `useRef<ComponentRef<"tag">>(null)` over a raw `HTMLXxxElement` type argument, so the DOM type stays derived from the JSX tag name instead of hand-picked. Auto-fixable when `ComponentRef` is already imported from `"react"` in the file. `ComponentRef` replaced `ElementRef`, which `@types/react` marks `@deprecated`.

`HTMLHeadingElement` (h1–h6) and element types without a known tag are still reported, without a fix: pick the tag the ref is actually attached to.

## ❌ Incorrect

```tsx
const ref = useRef<HTMLDivElement>(null);
```

## ✅ Correct

```tsx
import type { ComponentRef } from "react";

const ref = useRef<ComponentRef<"div">>(null);
```

## Options

This rule has no options.
