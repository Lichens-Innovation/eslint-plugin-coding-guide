# coding-guide/no-inline-render-function

Disallows calling a locally-declared `render*` helper function from within the JSX it's declared next to — extract a dedicated subcomponent instead so React can key/memoize it independently.

## ❌ Incorrect

```tsx
function Widget() {
  function renderHeader() {
    return <div />;
  }
  return <div>{renderHeader()}</div>;
}
```

## ✅ Correct

```tsx
function Header() {
  return <div />;
}

function Widget() {
  return (
    <div>
      <Header />
    </div>
  );
}
```

## Options

This rule has no options.
