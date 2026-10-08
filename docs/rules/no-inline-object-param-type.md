# coding-guide/no-inline-object-param-type

Disallows inline object-literal types where a named type should be extracted:

- on a function parameter (`({ a, b }: { a: string; b: number }) => ...`);
- nested inside an interface or type member (property, index signature, method), including within arrays, unions, generics and function types.

Extract a named `interface` and reference it instead. Only the outermost nested literal is reported; deeper ones surface once it is extracted.

## ❌ Incorrect

```ts
function f({ a, b }: { a: string; b: number }) {}

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
