import { ruleTester } from "../rule-tester.js";
import rule from "./no-inline-object-param-type.js";

ruleTester.run("no-inline-object-param-type", rule, {
  valid: [
    { code: "interface FooArgs { a: string; } function f({ a }: FooArgs) {}" },
    { code: "function f(a: string) {}" },
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
  ],
});
