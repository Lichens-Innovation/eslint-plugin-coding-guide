import { ruleTester } from "../rule-tester.js";
import rule from "./prefer-state-updater-form.js";

ruleTester.run("prefer-state-updater-form", rule, {
  valid: [{ code: `setCount((current) => current + 1);` }, { code: `setCount(0);` }, { code: `setName(newName);` }],
  invalid: [
    {
      code: `setCount(count + 1);`,
      errors: [{ messageId: "preferUpdaterForm", data: { setter: "setCount", state: "count" } }],
    },
  ],
});
