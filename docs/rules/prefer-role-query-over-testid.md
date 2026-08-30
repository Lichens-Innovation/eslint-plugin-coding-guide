# coding-guide/prefer-role-query-over-testid

Disallows Testing Library's `*ByTestId` queries — prefer the semantic, accessible `*ByRole` queries.

## ❌ Incorrect

```tsx
screen.getByTestId("submit-button");
```

## ✅ Correct

```tsx
screen.getByRole("button", { name: "Submit" });
```

## Options

This rule has no options.
