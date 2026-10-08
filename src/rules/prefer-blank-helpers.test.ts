import { RuleTester } from "@typescript-eslint/rule-tester";

import rule from "./prefer-blank-helpers.js";

const typedRuleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: { allowDefaultProject: ["*.ts"] },
      tsconfigRootDir: import.meta.dirname,
    },
  },
});

typedRuleTester.run("prefer-blank-helpers", rule, {
  valid: [
    { code: `declare const label: string; if (isBlank(label)) doSomething();` },
    { code: `declare const label: string | undefined; const value = isBlank(label) ? "default" : label;` },
    { code: `declare const label: string | undefined; const value = label ?? "default";` },
    { code: `declare const count: number; const value = count || 1;` },
    { code: `declare const flag: boolean | undefined; if (!flag) doSomething();` },
    { code: `declare const items: string[]; if (items.length === 0) doSomething();` },
    { code: `declare const value: string | number | null; if (value === "") doSomething();` },
    { code: `declare const user: { name: string } | undefined; if (!user) doSomething();` },
  ],
  invalid: [
    {
      code: `declare const label: string; if (label === "") doSomething();`,
      errors: [{ messageId: "preferIsBlank", data: { expr: "label" } }],
    },
    {
      code: `declare const label: string; if ("" !== label) doSomething();`,
      errors: [{ messageId: "preferIsNotBlank", data: { expr: "label" } }],
    },
    {
      code: `declare const label: string; if (label.trim() === "") doSomething();`,
      errors: [{ messageId: "preferIsBlank", data: { expr: "label" } }],
    },
    {
      code: `declare const label: string; if (label.trim().length === 0) doSomething();`,
      errors: [{ messageId: "preferIsBlank", data: { expr: "label" } }],
    },
    {
      code: `declare const label: string; if (label.length !== 0) doSomething();`,
      errors: [{ messageId: "preferIsNotBlank", data: { expr: "label" } }],
    },
    {
      code: `declare const label: string | null; if (!label) doSomething();`,
      errors: [{ messageId: "preferIsBlank", data: { expr: "label" } }],
    },
    {
      code: `declare const label: string | undefined; const hasName = !!label;`,
      errors: [{ messageId: "preferIsNotBlank", data: { expr: "label" } }],
    },
    {
      code: `declare const label: string; if (!label.trim()) doSomething();`,
      errors: [{ messageId: "preferIsBlank", data: { expr: "label" } }],
    },
    {
      code: `declare const newVersion: string; declare const currentVersion: string; resolve(newVersion || currentVersion);`,
      errors: [{ messageId: "preferBlankFallback", data: { expr: "newVersion" } }],
    },
  ],
});
