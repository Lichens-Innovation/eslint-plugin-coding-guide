import { ruleTester } from "../rule-tester.js";
import rule from "./prefer-role-query-over-testid.js";

ruleTester.run("prefer-role-query-over-testid", rule, {
  valid: [{ code: `screen.getByRole("button");` }, { code: `const el = getByText("hello");` }],
  invalid: [
    {
      code: `screen.getByTestId("submit");`,
      errors: [{ messageId: "preferRole", data: { name: "getByTestId" } }],
    },
    {
      code: `const el = queryAllByTestId("item");`,
      errors: [{ messageId: "preferRole", data: { name: "queryAllByTestId" } }],
    },
  ],
});
