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
  const renderToolCard = (tool: Tool) => <div key={tool.path} />;
  return <div>{tools.map(renderToolCard)}</div>;
}
```

## ✅ Correct

Each extracted component lives in its own `.tsx` file (see `one-component-per-tsx-file`):

```tsx
// header.tsx
export function Header() {
  return <div />;
}

// widget.tsx
export function Widget() {
  return (
    <div>
      <Header />
    </div>
  );
}
```

```tsx
// tool-card.tsx
interface ToolCardProps {
  path: string;
}

export function ToolCard({ path }: ToolCardProps) {
  return <div key={path} />;
}

// home.tsx
interface HomeProps {
  tools: Tool[];
}

export function Home({ tools }: HomeProps) {
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
interface WidgetProps {
  renderHeader: () => ReactNode;
}

function Widget({ renderHeader }: WidgetProps) {
  return <div>{renderHeader()}</div>;
}
```

Module-level `render*` helpers are not flagged either.

## Options

This rule has no options.
