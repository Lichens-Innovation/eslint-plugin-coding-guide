# coding-guide/one-component-per-tsx-file

Allows at most one module-level React component per `.tsx` file. Split additional components into their own files.

A module-level component is a PascalCase `const` (not a `use*` hook) whose value is an arrow function that returns JSX. Exported and non-exported (file-private) components both count.

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
