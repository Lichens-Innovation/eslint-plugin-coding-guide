# coding-guide/no-inline-curried-handler

Disallows declaring a curried handler factory (`(id) => () => fn(id)`, or a block body with a top-level `return () => ...`) as a local variable inside a function. The reader has to apply it twice to see what runs, and it is rebuilt on every render. Write the handler inline at the call site, or extract a child component that receives `id` and owns its handler. Moving the factory to module scope or a `*.utils.ts` file is only an option when it closes over no state, props or hooks.

## ❌ Incorrect

```tsx
function ItemList({ items, onSelect }: ItemListProps) {
  const makeHandler = (id: string) => () => onSelect(id);
  return items.map((item) => <Item key={item.id} onPress={makeHandler(item.id)} />);
}
```

## ✅ Correct

```tsx
function ItemList({ items, onSelect }: ItemListProps) {
  return items.map((item) => <Item key={item.id} onPress={() => onSelect(item.id)} />);
}
```

## Options

This rule has no options.
