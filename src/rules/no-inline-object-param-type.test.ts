import { ruleTester } from "../rule-tester.js";
import rule from "./no-inline-object-param-type.js";

ruleTester.run("no-inline-object-param-type", rule, {
  valid: [
    { code: "interface FooArgs { a: string; } function f({ a }: FooArgs) {}" },
    { code: "function f(a: string) {}" },
    { code: "interface ViewBox { x?: number; } interface Props { viewBox?: ViewBox; }" },
    { code: "type Props = { value: string };" },
    { code: "interface Props { items: string[]; onChange: (value: string) => void; }" },
  ],
  invalid: [
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
