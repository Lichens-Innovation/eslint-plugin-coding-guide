# coding-guide/todo-ticket-ref

Requires a ticket reference in `TODO` (and other configured term) comments — a bare `TODO: fix this` has no way to track follow-up; a ticket ID does.

## ❌ Incorrect

```tsx
// TODO: fix this
```

## ✅ Correct

```tsx
// TODO: JIRA-1234 fix this
```

## Options

| Option           | Type       | Default              | Description                                                    |
| ---------------- | ---------- | -------------------- | -------------------------------------------------------------- |
| `pattern`        | `string`   | `"([A-Z0-9]+-\\d+)"` | Regex a matching term's comment must contain somewhere.        |
| `terms`          | `string[]` | `["TODO"]`           | Comment marker terms to check (e.g. `TODO`, `FIXME`).          |
| `commentPattern` | `string`   | —                    | If set, replaces `pattern` as the full required comment shape. |
| `description`    | `string`   | —                    | Custom message appended instead of the pattern in the report.  |
