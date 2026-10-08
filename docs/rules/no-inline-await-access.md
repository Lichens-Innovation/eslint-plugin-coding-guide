# coding-guide/no-inline-await-access

Disallows operating directly on an awaited value, as in `(await promise).property`, `(await promise)[0]` or `(await promise).method()`. Wrapping an `await` in parentheses to chain on its outcome packs two steps into one line and is hard to read. Await the promise on its own line, assign the outcome to a named variable, then operate on it on the following line(s).

Type-only wrappers (`as`, `!`, `satisfies`) around the `await` are seen through.

## ❌ Incorrect

```tsx
const data = await (await fetch(url)).json();
const name = (await getUser(id)).name;
const first = (await getItems())[0];
const entries = (await listOpfsDirectoryEntries({ root, path })).sort(compareEntriesFoldersFirst);
```

## ✅ Correct

```tsx
const response = await fetch(url);
const data = await response.json();

const user = await getUser(id);
const name = user.name;

const items = await getItems();
const first = items[0];

const rawEntries = await listOpfsDirectoryEntries({ root, path });
const entries = rawEntries.sort(compareEntriesFoldersFirst);
```

## Options

This rule has no options.
