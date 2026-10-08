# coding-guide/prefer-antd-flex

In an Ant Design web app, prefers the idiomatic [`<Flex>`](https://ant.design/components/flex) component over a `<div>` whose `className` contains the `flex` utility class (e.g. `<div className="flex …">`).

The rule only checks `.tsx` files, and only when the app uses Ant Design: the file imports from `antd`, or the nearest `package.json` declares `antd` in `dependencies`, `devDependencies` or `peerDependencies`. Class strings are read from string literals, template literals and `clsx`/`cn`-style call arguments. Responsive variants (`md:flex`) and `inline-flex` are ignored since `<Flex>` cannot reproduce them.

## Migrating

The replacement must produce the **exact same visual**: same layout, spacing, margins and padding.

- Map the flex classes to `<Flex>` props:

  | Class       | `<Flex>` prop                                          |
  | ----------- | ------------------------------------------------------ |
  | `flex`      | _(implicit)_                                           |
  | `flex-col`  | `vertical`                                             |
  | `flex-wrap` | `wrap`                                                 |
  | `gap-*`     | `gap` (in px, e.g. `gap-2` → `8`)                      |
  | `items-*`   | `align` (e.g. `items-center` → `"center"`)             |
  | `justify-*` | `justify` (e.g. `justify-between` → `"space-between"`) |

- Keep every other class (padding, margins, sizing, colors, `flex-1`…) on `className`.
- Use a numeric `gap` matching the original value rather than `small`/`middle`/`large` when they differ (`small` = 8px, `middle` = 16px, `large` = 24px).
- Only migrate the `.tsx` files modified by the current branch — do not rewrite untouched files.

## ❌ Incorrect

```tsx
import { Button } from "antd";

export const Toolbar = () => (
  <div className="flex items-center justify-between gap-2 px-4 py-2">
    <Title />
    <Button>Save</Button>
  </div>
);
```

## ✅ Correct

```tsx
import { Button, Flex } from "antd";

export const Toolbar = () => (
  <Flex align="center" justify="space-between" gap={8} className="px-4 py-2">
    <Title />
    <Button>Save</Button>
  </Flex>
);
```

## Options

This rule has no options.
