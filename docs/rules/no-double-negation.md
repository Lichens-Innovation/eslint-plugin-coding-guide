# coding-guide/no-double-negation

Disallows double negations. They add mental load for no reason: the reader has to flip the meaning twice. Use the positive form instead. When the negation guards an `if`, invert the condition and swap the branches so the code reads naturally.

Reported patterns:

- `!` applied to a negatively named boolean, function or member (`isNot…`, `hasNo…`, `canNot…`, `shouldNot…`, …): `!isNotBlank(x)` → `isBlank(x)`, `!user.hasNoPermissions` → `user.hasPermissions`.
- `!` applied to an inequality: `!(a !== b)` → `a === b`.
- A declared name made of a negation plus a negative word (variables, functions, class members, interface members): `isNotDisabled` → `isEnabled`, `isNotInvalidEmail` → `isValidEmail`.

`!!value` (boolean coercion) is not reported.

## ❌ Incorrect

```ts
if (!isNotBlank(name)) {
  showError();
} else {
  save(name);
}

if (!(status !== "ready")) {
  start();
}

const isNotDisabled = !props.disabled;
```

## ✅ Correct

```ts
if (isBlank(name)) {
  showError();
} else {
  save(name);
}

if (status === "ready") {
  start();
}

const isEnabled = !props.disabled;
```

## Options

- `antonyms` (`Record<string, string>`) — extra negative words and their positive counterpart, merged with the defaults. Used to detect and suggest a rename for `isNot<Word>` names.

  Defaults: `Disabled`→`Enabled`, `Disallowed`→`Allowed`, `Disconnected`→`Connected`, `Hidden`→`Visible`, `Inactive`→`Active`, `Incomplete`→`Complete`, `Incorrect`→`Correct`, `Invalid`→`Valid`, `Invisible`→`Visible`, `Unauthorized`→`Authorized`, `Unavailable`→`Available`, `Unchecked`→`Checked`, `Undefined`→`Defined`, `Unknown`→`Known`, `Unselected`→`Selected`, `Unverified`→`Verified`.

```ts
"coding-guide/no-double-negation": ["error", { antonyms: { Archived: "Active" } }]
```
