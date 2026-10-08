# coding-guide/max-files-per-folder

Enforces a maximum number of source files directly inside a folder. Past that threshold, a flat folder becomes hard to scan — split it into sub-folders grouping related files (by feature, by concern).

Only direct children count: sub-folders and their content are ignored. Companion files that travel with the code they describe are not counted either — `*.test.*`, `*.spec.*`, `*.stories.*`, `*.d.ts` and `index.*` barrels — nor are non-source files (`.css`, `.json`, assets…). Counted extensions: `.ts`, `.tsx`, `.js`, `.jsx`, `.mts`, `.cts`.

The error is reported on every counted file of the offending folder, so it shows up whichever file is open or staged.

## ❌ Incorrect

```
src/features/
├── api-client.ts
├── auth-guard.tsx
├── … (19 more source files)
```

## ✅ Correct

```
src/features/
├── auth/
│   ├── auth-guard.tsx
│   └── …
├── api/
│   ├── api-client.ts
│   └── …
```

## Options

- `max` (`number`) — the maximum number of source files per folder. Defaults to `20`.
- `ignoreFolders` (`string[]`) — glob patterns matched against the folder's absolute path to skip legitimately flat folders (generated code, migrations…). Defaults to `[]`.

```js
{
  rules: {
    "coding-guide/max-files-per-folder": ["error", { max: 15, ignoreFolders: ["**/migrations", "**/__generated__"] }],
  },
}
```
