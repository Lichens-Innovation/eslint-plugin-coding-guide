import { ruleTester } from "../rule-tester.js";
import rule from "./prefer-some-over-find-check.js";

ruleTester.run("prefer-some-over-find-check", rule, {
  valid: [
    { code: `items.some((item) => item.id === id);` },
    { code: `const found = items.find((item) => item.id === id);` },
  ],
  invalid: [
    {
      code: `items.find((item) => item.id === id) !== undefined;`,
      output: `items.some((item) => item.id === id);`,
      errors: [{ messageId: "preferSome" }],
    },
    {
      code: `items.find((item) => item.id === id) === undefined;`,
      output: `!items.some((item) => item.id === id);`,
      errors: [{ messageId: "preferSome" }],
    },
    {
      code: `!items.find((item) => item.id === id);`,
      output: `!items.some((item) => item.id === id);`,
      errors: [{ messageId: "preferSome" }],
    },
  ],
});
