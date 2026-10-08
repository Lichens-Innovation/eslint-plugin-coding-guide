# coding-guide/filename-convention-by-export-shape

Enforces the project's file-naming convention against a file's actual exported shape: hooks must live in `use-*.ts`, and `Page`/`Dialog`/`Provider`-suffixed components must live in `*-page.tsx` / `*-dialog.tsx` / `*-provider.tsx`. Also blocks generic, un-prefixed basenames (`utils`, `types`, `helpers`, `constants`, `config`, `client`, `index`) in any folder, whatever the file exports. The hook and suffix checks only fire when a file has exactly one function-like named export — multi-export files (stores, shared utils/types modules) are left alone rather than guessed at.

## ❌ Incorrect

```tsx
// counter.ts
export const useCounter = () => {
  // hook using useState or useEffect, or useXyz
  return xyz;
};
```

```tsx
// create-user.tsx
export const CreateUserDialog = () => null;
```

```ts
// features/orders/utils.ts
export const formatOrderId = (id: string) => `#${id}`;
```

## ✅ Correct

```tsx
// use-counter.ts
export const useCounter = () => {
  // hook using useState or useEffect, or useXyz
  return xyz;
};
```

```tsx
// create-user-dialog.tsx
export const CreateUserDialog = () => null;
```

```ts
// features/orders/order.utils.ts
export const formatOrderId = (id: string) => `#${id}`;
```

## Options

This rule has no options.
