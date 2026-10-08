# coding-guide/prefer-jsx-short-circuit

Prefers `{cond && <X/>}` over `{cond ? <X/> : null}` for optional JSX children, and requires the left side of a JSX `&&` to be boolean-ish (`!!value`, `length > 0`, or an already-boolean expression) so a stray `0` or `""` cannot leak into the rendered output. Auto-fixable.

Only the guard operands are checked: the last `&&` operand is the rendered content and may be any renderable value (JSX, string, node...).

## ❌ Incorrect

```tsx
function OrdersPanel({ isLoading, error, orders, isMobile, isFilterOpen }) {
  if (isLoading) return <Spinner />;
  if (error) return <ErrorAlert error={error} />;

  return (
    <Panel>
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
function OrdersPanel({ isLoading, error, orders, isMobile, isFilterOpen }) {
  if (isLoading) return <Spinner />;
  if (error) return <ErrorAlert error={error} />;

  return (
    <Panel>
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
