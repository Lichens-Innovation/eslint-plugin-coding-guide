# coding-guide/prefer-props-with-children

Disallows hand-declaring a `children: ReactNode` property on a props interface — use `PropsWithChildren<Props>` instead.

## ❌ Incorrect

```tsx
interface CardProps {
  title: string;
  children: ReactNode;
}
```

## ✅ Correct

```tsx
type CardProps = PropsWithChildren<{
  title: string;
}>;
```

## Options

This rule has no options.
