import { ruleTester } from "../rule-tester.js";
import rule from "./prefer-positive-condition.js";

ruleTester.run("prefer-positive-condition", rule, {
  valid: [{ code: `const x = isOpen ? a : b;` }, { code: `const x = a > 0 ? a : b;` }],
  invalid: [
    {
      code: `const x = !isOpen ? a : b;`,
      output: `const x = isOpen ? b : a;`,
      errors: [{ messageId: "preferPositive" }],
    },
  ],
});
