import { ruleTester } from "../rule-tester.js";
import rule from "./prefer-props-with-children.js";

ruleTester.run("prefer-props-with-children", rule, {
  valid: [
    { code: `interface CardProps { title: string; }` },
    { code: `type CardProps = PropsWithChildren<{ title: string }>;` },
  ],
  invalid: [
    {
      code: `interface CardProps { title: string; children: ReactNode; }`,
      errors: [{ messageId: "preferPropsWithChildren", data: { name: "CardProps" } }],
    },
  ],
});
