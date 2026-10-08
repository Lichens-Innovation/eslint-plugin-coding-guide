import { RuleTester } from "@typescript-eslint/rule-tester";

import { ruleTester } from "../rule-tester.js";
import rule from "./prefer-jsx-short-circuit.js";

ruleTester.run("prefer-jsx-short-circuit", rule, {
  valid: [
    { code: `const el = <div>{isOpen && <Modal />}</div>;` },
    { code: `const el = <div>{!!count && <Badge count={count} />}</div>;` },
    { code: `const el = <div>{items.length > 0 && <List items={items} />}</div>;` },
    { code: `const el = <div>{!isMobile && "Clear"}</div>;` },
    { code: `const el = <div>{isOpen && label}</div>;` },
    { code: `const el = <div>{isOpen && \`\${count} items\`}</div>;` },
    { code: `const el = <div>{a > 0 && b > 0 && "text"}</div>;` },
  ],
  invalid: [
    {
      code: `const el = <div>{isOpen ? <Modal /> : null}</div>;`,
      output: `const el = <div>{isOpen && <Modal />}</div>;`,
      errors: [{ messageId: "preferShortCircuit" }],
    },
    {
      code: `const el = <div>{items.length && <List items={items} />}</div>;`,
      output: `const el = <div>{items.length > 0 && <List items={items} />}</div>;`,
      errors: [{ messageId: "requireBooleanGuard" }],
    },
    {
      code: `const el = <div>{items.length && "text"}</div>;`,
      output: `const el = <div>{items.length > 0 && "text"}</div>;`,
      errors: [{ messageId: "requireBooleanGuard" }],
    },
  ],
});

const typedRuleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaFeatures: { jsx: true },
      projectService: { allowDefaultProject: ["*.tsx"] },
      tsconfigRootDir: import.meta.dirname,
    },
  },
});

const IMPORT_IS_NOT_BLANK = `import { isNotBlank } from "@lichens-innovation/ts-common";\n`;

typedRuleTester.run("prefer-jsx-short-circuit (typed)", rule, {
  valid: [
    { filename: "file.tsx", code: `declare const isOpen: boolean; const el = <div>{isOpen && <Modal />}</div>;` },
    {
      filename: "file.tsx",
      code: `${IMPORT_IS_NOT_BLANK}declare const label: string | undefined; const el = <div>{isNotBlank(label) && <span>{label}</span>}</div>;`,
    },
  ],
  invalid: [
    {
      filename: "file.tsx",
      code: `${IMPORT_IS_NOT_BLANK}declare const label: string | undefined; const el = <div>{label && <span>{label}</span>}</div>;`,
      output: `${IMPORT_IS_NOT_BLANK}declare const label: string | undefined; const el = <div>{isNotBlank(label) && <span>{label}</span>}</div>;`,
      errors: [{ messageId: "requireBlankGuard", data: { expr: "label" } }],
    },
    {
      filename: "file.tsx",
      code: `declare const label: string; const el = <div>{label && <span>{label}</span>}</div>;`,
      output: null,
      errors: [{ messageId: "requireBlankGuard", data: { expr: "label" } }],
    },
    {
      filename: "file.tsx",
      code: `declare const label: string; const el = <div>{label ? <span>{label}</span> : null}</div>;`,
      output: null,
      errors: [{ messageId: "preferShortCircuit" }],
    },
    {
      filename: "file.tsx",
      code: `declare const user: { name: string } | undefined; const el = <div>{user && <span />}</div>;`,
      output: `declare const user: { name: string } | undefined; const el = <div>{!!user && <span />}</div>;`,
      errors: [{ messageId: "requireBooleanGuard" }],
    },
  ],
});
