import { ruleTester } from "../rule-tester.js";
import rule from "./no-inline-object-param-type.js";

ruleTester.run("no-inline-object-param-type", rule, {
  valid: [
    { code: "interface FooArgs { a: string; } function f({ a }: FooArgs) {}" },
    { code: "function f(a: string) {}" },
    { code: "interface ViewBox { x?: number; } interface Props { viewBox?: ViewBox; }" },
    { code: "type Props = { value: string };" },
    { code: "interface Props { items: string[]; onChange: (value: string) => void; }" },
    {
      code: "const axis = option.xAxis as { axisLabel: { formatter: (timestamp: number) => string } };",
      filename: "chart.utils.test.ts",
    },
    { code: "interface Loaded { a: string } const [loaded] = useState<Loaded>();" },
    { code: "interface R { rpm?: number } const f = (s: string): R => ({});" },
    { code: "type X = Record<string, { a: string }>;" },
    { code: "const x = { a: 1 } as { a: number };" },
    { code: "const f = (a: { b: string }[]) => a;" },
    { code: "const axis = <{ axisLabel: { show: boolean } }>option.xAxis;", filename: "chart.utils.spec.ts" },
  ],
  invalid: [
    {
      code: "const [loaded, setLoaded] = useState<{ filename: string; stats: Stats }>();",
      errors: [{ messageId: "extractTypeArgInterface" }],
    },
    {
      code: "const m = new Map<string, { id: string }[]>();",
      errors: [{ messageId: "extractTypeArgInterface" }],
    },
    {
      code: "export const validate = (search: RawSearch): { rpm?: number } => ({});",
      errors: [{ messageId: "extractReturnInterface" }],
    },
    {
      code: "async function f(): Promise<{ id: string } | null> { return null; }",
      errors: [{ messageId: "extractReturnInterface" }],
    },
    {
      code: "const x: { a: string } = { a: '' };",
      errors: [{ messageId: "extractVariableInterface" }],
    },
    {
      code: "const { a }: { a: string } = obj;",
      errors: [{ messageId: "extractVariableInterface" }],
    },
    {
      code: "const axis = option.xAxis as { axisLabel: { formatter: (timestamp: number) => string } };",
      filename: "chart.utils.ts",
      errors: [{ messageId: "extractNestedInterface" }],
    },
    {
      code: "const f = ({ a }: { a: { b: string } }) => a;",
      filename: "chart.utils.test.ts",
      errors: [{ messageId: "extractInterface" }, { messageId: "extractNestedInterface" }],
    },
    {
      code: "function f({ a, b }: { a: string; b: number }) {}",
      errors: [{ messageId: "extractInterface" }],
    },
    {
      code: "const f = ({ a }: { a: string }) => a;",
      errors: [{ messageId: "extractInterface" }],
    },
    {
      code: "export interface Props { value: string; viewBox?: { x?: number; y?: number; height?: number }; }",
      errors: [{ messageId: "extractNestedInterface" }],
    },
    {
      code: "type Props = { viewBox: { x: number } };",
      errors: [{ messageId: "extractNestedInterface" }],
    },
    {
      code: "interface Props { points: Array<{ x: number }>; range: { min: number } | undefined; }",
      errors: [{ messageId: "extractNestedInterface" }, { messageId: "extractNestedInterface" }],
    },
    {
      code: "interface Props { onChange: (value: { id: string }) => void; }",
      errors: [{ messageId: "extractNestedInterface" }],
    },
    {
      code: "interface Props { byId: { [id: string]: { name: string } }; }",
      errors: [{ messageId: "extractNestedInterface" }],
    },
    {
      code: "interface Store { get(key: { id: string }): void; }",
      errors: [{ messageId: "extractNestedInterface" }],
    },
  ],
});
