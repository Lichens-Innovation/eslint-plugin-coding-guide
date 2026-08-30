import { ruleTester } from "../rule-tester.js";
import rule from "./filename-convention-by-export-shape.js";

ruleTester.run("filename-convention-by-export-shape", rule, {
  valid: [
    { code: "export const useCounter = () => 1;", filename: "use-counter.ts" },
    { code: "export const CreateUserDialog = () => null;", filename: "create-user-dialog.tsx" },
    { code: "export const parseDate = (value: string) => new Date(value);", filename: "date.utils.ts" },
    { code: "export const a = 1; export const b = 2;", filename: "shared-values.ts" },
  ],
  invalid: [
    {
      code: "export const useCounter = () => 1;",
      filename: "counter.ts",
      errors: [{ messageId: "hookFilename", data: { name: "useCounter" } }],
    },
    {
      code: "export const CreateUserDialog = () => null;",
      filename: "create-user.tsx",
      errors: [
        {
          messageId: "suffixFilename",
          data: { name: "CreateUserDialog", nameSuffix: "Dialog", kebabSuffix: "-dialog" },
        },
      ],
    },
    {
      code: "export const parseDate = (value: string) => new Date(value);",
      filename: "utils.ts",
      errors: [{ messageId: "genericBasename", data: { basename: "utils", example: "<domain>.utils.ts" } }],
    },
  ],
});
