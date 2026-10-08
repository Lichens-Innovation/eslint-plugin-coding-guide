# coding-guide/prefer-get-error-message

Disallows extracting an error message by hand with `error instanceof Error ? error.message : …` — prefer `getErrorMessage(error)` from `@lichens-innovation/ts-common`, which already handles `Error` instances, any object with a `message`, strings, empty values and other unknown values.

The negated form `!(error instanceof Error) ? … : error.message` is reported too.

## ❌ Incorrect

```ts
try {
  await save();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  notify(message);
}
```

## ✅ Correct

```ts
import { getErrorMessage } from "@lichens-innovation/ts-common";

try {
  await save();
} catch (error) {
  notify(getErrorMessage(error));
}
```

## Options

This rule has no options.
