import { ruleTester } from "../rule-tester.js";
import rule from "./prefer-includes-over-or-chain.js";

ruleTester.run("prefer-includes-over-or-chain", rule, {
  valid: [
    { code: `["a", "b", "c"].includes(x);` },
    { code: `x === "a" || y === "b";` },
    { code: `x === "a" || x === getValue();` },
  ],
  invalid: [
    {
      code: `x === "a" || x === "b" || x === "c";`,
      output: `["a", "b", "c"].includes(x);`,
      errors: [{ messageId: "preferIncludes" }],
    },
    {
      code: `status == "open" || status == "pending";`,
      output: `["open", "pending"].includes(status);`,
      errors: [{ messageId: "preferIncludes" }],
    },
  ],
});
