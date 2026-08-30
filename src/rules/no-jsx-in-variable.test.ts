import { ruleTester } from "../rule-tester.js";
import rule from "./no-jsx-in-variable.js";

ruleTester.run("no-jsx-in-variable", rule, {
  valid: [{ code: "const Widget = () => <div />;" }, { code: "const x = 1;" }],
  invalid: [
    {
      code: "const el = <div />;",
      errors: [{ messageId: "declareComponent" }],
    },
    {
      code: "const el = <>hi</>;",
      errors: [{ messageId: "declareComponent" }],
    },
  ],
});
