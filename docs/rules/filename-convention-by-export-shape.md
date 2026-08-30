# coding-guide/filename-convention-by-export-shape

Enforces the project's file-naming convention against a file's actual exported shape: hooks must live in `use-*.ts`, and `Page`/`Dialog`/`Provider`-suffixed components must live in `*-page.tsx` / `*-dialog.tsx` / `*-provider.tsx`. Also blocks generic, un-prefixed root-level basenames (`utils.ts`, `types.ts`, ...). Only fires when a file has exactly one function-like named export — multi-export files (stores, shared utils/types modules) are left alone rather than guessed at.

## ❌ Incorrect

```tsx
// counter.ts
export const useCounter = () => 1;
```

```tsx
// create-user.tsx
export const CreateUserDialog = () => null;
```

## ✅ Correct

```tsx
// use-counter.ts
export const useCounter = () => 1;
```

```tsx
// create-user-dialog.tsx
export const CreateUserDialog = () => null;
```

## Options

This rule has no options.
