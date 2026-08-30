import { ruleTester } from "../rule-tester.js";
import rule from "./no-hook-returning-jsx.js";

ruleTester.run("no-hook-returning-jsx", rule, {
  valid: [
    { code: "function useCounter() { return 1; }" },
    { code: "const useCounter = () => 1;" },
    { code: "function Widget() { return <div />; }" },
    { code: "function useRenderer() { return () => <div />; }" },
  ],
  invalid: [
    {
      code: "function useWidget() { return <div />; }",
      errors: [{ messageId: "hookReturnsJsx", data: { name: "useWidget" } }],
    },
    {
      code: "const useWidget = () => <div />;",
      errors: [{ messageId: "hookReturnsJsx", data: { name: "useWidget" } }],
    },
  ],
});
