import { ruleTester } from "../rule-tester.js";
import rule from "./prefer-reactnode-over-jsxelement-union.js";

ruleTester.run("prefer-reactnode-over-jsxelement-union", rule, {
  valid: [{ code: `type Result = ReactNode;` }, { code: `type Result = JSX.Element | string;` }],
  invalid: [
    {
      code: `
        import { ReactNode } from "react";
        type Result = JSX.Element | null | undefined;
      `,
      output: `
        import { ReactNode } from "react";
        type Result = ReactNode;
      `,
      errors: [{ messageId: "preferReactNode" }],
    },
    {
      code: `type Result = ReactElement | null;`,
      errors: [{ messageId: "preferReactNode" }],
    },
  ],
});
