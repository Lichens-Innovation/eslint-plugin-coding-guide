import { ruleTester } from "../rule-tester.js";
import rule from "./no-non-hook-use-prefix.js";

ruleTester.run("no-non-hook-use-prefix", rule, {
  valid: [
    { code: "function useCounter() { return useState(0); }" },
    { code: "const useCounter = () => useState(0);" },
    { code: "function submitForm() { return fetch('/x'); }" },
  ],
  invalid: [
    {
      code: "function useCounter() { return 0; }",
      errors: [{ messageId: "misnamed", data: { name: "useCounter" } }],
    },
    {
      code: "const useCounter = () => 0;",
      errors: [{ messageId: "misnamed", data: { name: "useCounter" } }],
    },
  ],
});
