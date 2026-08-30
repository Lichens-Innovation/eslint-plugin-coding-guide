import { ruleTester } from "../rule-tester.js";
import rule from "./no-tests-in-dunder-folder.js";

ruleTester.run("no-tests-in-dunder-folder", rule, {
  valid: [{ code: "test('x', () => {});", filename: "widget.test.ts" }],
  invalid: [
    {
      code: "test('x', () => {});",
      filename: "src/__tests__/widget.test.ts",
      errors: [{ messageId: "colocate" }],
    },
  ],
});
