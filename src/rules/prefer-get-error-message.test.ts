import { ruleTester } from "../rule-tester.js";
import rule from "./prefer-get-error-message.js";

ruleTester.run("prefer-get-error-message", rule, {
  valid: [
    { code: `const message = getErrorMessage(error);` },
    { code: `const message = error instanceof Error ? other.message : String(error);` },
    { code: `const message = error instanceof TypeError ? error.message : String(error);` },
    { code: `const name = error instanceof Error ? error.name : "unknown";` },
    { code: `const message = !(error instanceof Error) ? error.message : "unknown";` },
  ],
  invalid: [
    {
      code: `const message = error instanceof Error ? error.message : String(error);`,
      errors: [{ messageId: "preferGetErrorMessage", data: { expr: "error" } }],
    },
    {
      code: `const message = e instanceof Error ? e.message : "Unknown error";`,
      errors: [{ messageId: "preferGetErrorMessage", data: { expr: "e" } }],
    },
    {
      code: `const message = !(error instanceof Error) ? JSON.stringify(error) : error.message;`,
      errors: [{ messageId: "preferGetErrorMessage", data: { expr: "error" } }],
    },
    {
      code: `log(result.error instanceof Error ? result.error.message : \`\${result.error}\`);`,
      errors: [{ messageId: "preferGetErrorMessage", data: { expr: "result.error" } }],
    },
  ],
});
