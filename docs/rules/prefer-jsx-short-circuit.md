# coding-guide/prefer-jsx-short-circuit

Prefers `{cond && <X/>}` over `{cond ? <X/> : null}` for optional JSX children, and requires the left side of a JSX `&&` to be boolean-ish (`!!value`, `length > 0`, or an already-boolean expression) so a stray `0` or `""` cannot leak into the rendered output. Auto-fixable.

## ❌ Incorrect

```tsx
const el = <div>{isOpen ? <Modal /> : null}</div>;
const list = <div>{items.length && <List items={items} />}</div>;
```

## ✅ Correct

```tsx
const el = <div>{isOpen && <Modal />}</div>;
const list = <div>{items.length > 0 && <List items={items} />}</div>;
```

## Options

This rule has no options.
