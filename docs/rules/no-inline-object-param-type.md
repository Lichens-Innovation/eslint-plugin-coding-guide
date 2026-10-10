# coding-guide/no-inline-object-param-type

Disallows inline object-literal types where a named type should be extracted:

- on a function parameter (`({ a, b }: { a: string; b: number }) => ...`);
- on a function return type, including within arrays, unions and generics (`(): { rpm?: number } => ...`, `(): Promise<{ id: string }>`);
- on a variable annotation (`const x: { a: string } = ...`);
- as a type argument of a call or `new` expression (`useState<{ a: string }>()`, `new Map<string, { id: string }>()`);
- nested inside an interface or type member (property, index signature, method), including within arrays, unions, generics and function types.

Extract a named `interface` and reference it instead. Only the outermost nested literal is reported; deeper ones surface once it is extracted.

In test files (`*.test.*`, `*.spec.*`), object types inside an `as` or `<T>` cast are not reported: a one-off cast to reach into a value under test doesn't need a named type.

## ❌ Incorrect

```ts
function f({ a, b }: { a: string; b: number }) {}

const validate = (search: RawSearch): { rpm?: number } => ({});

const [loaded, setLoaded] = useState<{ filename: string; stats: Stats }>();

export interface PumpChartBepLineLabelProps {
  value: string;
  viewBox?: { x?: number; y?: number; height?: number };
}
```

## ✅ Correct

```ts
interface FArgs {
  a: string;
  b: number;
}

function f({ a, b }: FArgs) {}

interface ValidatedSearch {
  rpm?: number;
}

const validate = (search: RawSearch): ValidatedSearch => ({});

interface LoadedFile {
  filename: string;
  stats: Stats;
}

const [loaded, setLoaded] = useState<LoadedFile>();

interface PumpChartViewBox {
  x?: number;
  y?: number;
  height?: number;
}

export interface PumpChartBepLineLabelProps {
  value: string;
  viewBox?: PumpChartViewBox;
}
```

## Options

This rule has no options.
