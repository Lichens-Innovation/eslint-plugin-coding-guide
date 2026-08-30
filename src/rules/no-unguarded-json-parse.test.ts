import { ruleTester } from "../rule-tester.js";
import rule from "./no-unguarded-json-parse.js";

ruleTester.run("no-unguarded-json-parse", rule, {
  valid: [
    {
      code: `
        try {
          const data = JSON.parse(raw);
        } catch (error) {
          console.error(error);
        }
      `,
    },
    {
      code: `
        function parse(raw: string) {
          try {
            return JSON.parse(raw);
          } catch {
            return null;
          }
        }
      `,
    },
  ],
  invalid: [
    {
      code: "const data = JSON.parse(raw);",
      errors: [{ messageId: "unguarded" }],
    },
    {
      code: `
        function parse(raw: string) {
          return JSON.parse(raw);
        }
      `,
      errors: [{ messageId: "unguarded" }],
    },
  ],
});
