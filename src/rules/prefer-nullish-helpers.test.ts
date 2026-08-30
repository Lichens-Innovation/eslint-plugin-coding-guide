import { ruleTester } from "../rule-tester.js";
import rule from "./prefer-nullish-helpers.js";

ruleTester.run("prefer-nullish-helpers", rule, {
  valid: [
    { code: `if (isNullish(value)) doSomething();` },
    { code: `if (value !== null && other !== undefined) doSomething();` },
    { code: `if (value !== null && value !== 0) doSomething();` },
  ],
  invalid: [
    {
      code: `if (value !== null && value !== undefined) doSomething();`,
      errors: [{ messageId: "preferNotNullish", data: { expr: "value" } }],
    },
    {
      code: `if (value === null || value === undefined) doSomething();`,
      errors: [{ messageId: "preferNullish", data: { expr: "value" } }],
    },
  ],
});
