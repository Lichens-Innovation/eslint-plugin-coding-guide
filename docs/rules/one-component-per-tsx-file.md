# coding-guide/one-component-per-tsx-file

Allows at most one module-level React component per `.tsx` file. Split additional components into their own files.

A module-level component is a PascalCase `const` (not a `use*` hook) whose value is a function that returns JSX, either directly or wrapped in `memo`, `forwardRef` or `observer` (also nested, e.g. `memo(forwardRef(...))`, or as `React.memo`). Exported and non-exported (file-private) components both count, as does a default-exported component.

## ❌ Incorrect

```tsx
export const Widget = () => {
  return <WidgetHeader />;
};

const WidgetHeader = () => {
  return <header />;
};
```

`WidgetHeader` is private to the file but still a second module-level component — move it out.

```tsx
const WidgetContent = observer(() => {
  return <div />;
});

export const Widget = observer(() => {
  return <WidgetContent />;
});
```

Wrapping a component in `observer` (or `memo` / `forwardRef`) doesn't change that: `Widget` is a second component.

## ✅ Correct

```tsx
// widget.tsx
import { WidgetHeader } from "./widget-header";

export const Widget = () => {
  return <WidgetHeader />;
};
```

```tsx
// widget-header.tsx
export const WidgetHeader = () => {
  return <header />;
};
```

## Options

This rule has no options.
