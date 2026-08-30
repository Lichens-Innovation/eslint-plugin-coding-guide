import { ruleTester } from "../rule-tester.js";
import rule from "./no-exported-mutable-state.js";

ruleTester.run("no-exported-mutable-state", rule, {
  valid: [{ code: "export const x = 1;" }, { code: "let x = 1;" }, { code: "export function f() {}" }],
  invalid: [
    {
      code: "export let x = 1;",
      errors: [{ messageId: "noMutableExport", data: { kind: "let" } }],
    },
    {
      code: "export var x = 1;",
      errors: [{ messageId: "noMutableExport", data: { kind: "var" } }],
    },
  ],
});
