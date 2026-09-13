# coding-guide/no-inline-render-function

Disallows locally-declared `render*` helpers that return JSX, and using them from JSX (call or reference) — extract a dedicated subcomponent instead so React can key/memoize it independently.

## ❌ Incorrect

```tsx
function Widget() {
  function renderHeader() {
    return <div />;
  }
  return <div>{renderHeader()}</div>;
}
```

```tsx
function Home() {
  const renderToolCard = (tool: { path: string }) => <div key={tool.path} />;
  return <div>{tools.map(renderToolCard)}</div>;
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

```tsx
function ToolCard({ path }: { path: string }) {
  return <div key={path} />;
}

function Home({ tools }: { tools: { path: string }[] }) {
  return (
    <div>
      {tools.map((tool) => (
        <ToolCard key={tool.path} path={tool.path} />
      ))}
    </div>
  );
}
```

Render-prop parameters (passed in from outside) remain allowed:

```tsx
function Widget({ renderHeader }: { renderHeader: () => JSX.Element }) {
  return <div>{renderHeader()}</div>;
}
```

## Options

This rule has no options.
