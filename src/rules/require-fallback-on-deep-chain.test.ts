import { ruleTester } from "../rule-tester.js";
import rule from "./require-fallback-on-deep-chain.js";

ruleTester.run("require-fallback-on-deep-chain", rule, {
  valid: [{ code: `const city = user?.address?.location?.city ?? "Unknown";` }, { code: `const name = user?.name;` }],
  invalid: [
    {
      code: `const city = user?.address?.location?.city;`,
      errors: [{ messageId: "requireFallback", data: { depth: 3 } }],
    },
    {
      code: `const value = obj?.a?.b;`,
      options: [{ minDepth: 2 }],
      errors: [{ messageId: "requireFallback", data: { depth: 2 } }],
    },
  ],
});
