import { ruleTester } from "../rule-tester.js";
import rule from "./no-explicit-undefined-optional.js";

ruleTester.run("no-explicit-undefined-optional", rule, {
  valid: [
    { code: "function f(a?: string) {}" },
    { code: "interface Foo { a?: string; }" },
    { code: "function f(a: string | number) {}" },
    { code: "function f(a: string = 'x') {}" },
  ],
  invalid: [
    {
      code: "function f(a: string | undefined) {}",
      output: "function f(a?: string) {}",
      errors: [{ messageId: "useOptionalModifier", data: { what: "this parameter" } }],
    },
    {
      code: "interface Foo { a: string | undefined; }",
      output: "interface Foo { a?: string; }",
      errors: [{ messageId: "useOptionalModifier", data: { what: "this property" } }],
    },
    {
      code: "function f(a?: string | undefined) {}",
      output: "function f(a?: string) {}",
      errors: [{ messageId: "redundantUndefined", data: { what: "this parameter" } }],
    },
  ],
});
