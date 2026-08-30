# coding-guide/no-inline-guard-chain-handler

Disallows a JSX prop arrow function whose concise body is a `&&` guard chain of 3+ operands (e.g. `onPress={() => !a && !b && doIt()}`) — extract a named handler with early returns instead.

## ❌ Incorrect

```tsx
<Button onPress={() => !a && !b && !c && doIt()} />
```

## ✅ Correct

```tsx
const handlePress = () => {
  if (a || b || c) return;
  doIt();
};

<Button onPress={handlePress} />;
```

## Options

This rule has no options.
