import { ruleTester } from "../rule-tester.js";
import rule from "./hoist-static-component-constants.js";

ruleTester.run("hoist-static-component-constants", rule, {
  valid: [
    { code: "const OPTIONS = ['a', 'b'];" },
    { code: "function useThing() { const local = 1; const options = [local]; return options; }" },
    { code: "function Widget() { const config = {}; return null; }" },
  ],
  invalid: [
    {
      code: "function Widget() { const options = ['a', 'b']; return options; }",
      errors: [{ messageId: "hoist", data: { name: "options" } }],
    },
    {
      code: "const Widget = () => { const config = { a: 1 }; return config; };",
      errors: [{ messageId: "hoist", data: { name: "config" } }],
    },
    {
      code: "function useThing() { const options = ['a', 'b']; return options; }",
      errors: [{ messageId: "hoist", data: { name: "options" } }],
    },
  ],
});
