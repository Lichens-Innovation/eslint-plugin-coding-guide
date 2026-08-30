# coding-guide/prefer-reactnode-over-jsxelement-union

Disallows a `JSX.Element | null | undefined`-style union prop type — `ReactNode` says the same thing and is the idiomatic type for "anything renderable". Auto-fixable when `ReactNode` is already imported from `"react"`.

## ❌ Incorrect

```tsx
interface Props {
  icon: JSX.Element | null | undefined;
}
```

## ✅ Correct

```tsx
import type { ReactNode } from "react";

interface Props {
  icon: ReactNode;
}
```

## Options

This rule has no options.
