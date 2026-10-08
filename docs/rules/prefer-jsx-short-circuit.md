# coding-guide/prefer-jsx-short-circuit

Prefers `{cond && <X/>}` over `{cond ? <X/> : null}` for optional JSX children, and requires the left side of a JSX `&&` to be boolean-ish (`length > 0`, `isNotBlank(text)`, `!!value`, or an already-boolean expression) so a stray `0` or `""` cannot leak into the rendered output. Auto-fixable.

With type information, a string guard is reported with `isNotBlank(text)` from `@lichens-innovation/ts-common` rather than `!!text` (which `prefer-blank-helpers` rejects). It is only autofixed when `isNotBlank` is already imported in the file.

Only the guard operands are checked: the last `&&` operand is the rendered content and may be any renderable value (JSX, string, node...).

## ❌ Incorrect

```tsx
function OrdersPanel({ isLoading, error, orders, isMobile, isFilterOpen, title }: OrdersPanelProps) {
  if (isLoading) return <Spinner />;
  if (error) return <ErrorAlert error={error} />;

  return (
    <Panel>
      {title && <h2>{title}</h2>}
      {isFilterOpen ? <OrdersFilter /> : null}
      {orders.length && <OrdersTable orders={orders} />}
      {orders.length && "Export"}
      {!isMobile && "Last 30 days"}
    </Panel>
  );
}
```

## ✅ Correct

```tsx
function OrdersPanel({ isLoading, error, orders, isMobile, isFilterOpen, title }: OrdersPanelProps) {
  if (isLoading) return <Spinner />;
  if (error) return <ErrorAlert error={error} />;

  return (
    <Panel>
      {isNotBlank(title) && <h2>{title}</h2>}
      {isFilterOpen && <OrdersFilter />}
      {orders.length > 0 && <OrdersTable orders={orders} />}
      {orders.length > 0 && "Export"}
      {!isMobile && "Last 30 days"}
    </Panel>
  );
}
```

## Options

This rule has no options.
