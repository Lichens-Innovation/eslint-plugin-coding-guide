import { ruleTester } from "../rule-tester.js";
import rule from "./require-numeric-enum-initializer.js";

ruleTester.run("require-numeric-enum-initializer", rule, {
  valid: [{ code: `enum Status { Active = 1, Inactive = 2 }` }],
  invalid: [
    {
      code: `enum Status { Active, Inactive }`,
      errors: [
        { messageId: "missingInitializer", data: { name: "Active" } },
        { messageId: "missingInitializer", data: { name: "Inactive" } },
      ],
    },
  ],
});
