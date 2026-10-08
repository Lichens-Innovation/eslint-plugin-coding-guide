import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ruleTester } from "../rule-tester.js";
import rule from "./prefer-antd-flex.js";

const antdAppDirectory = mkdtempSync(join(tmpdir(), "prefer-antd-flex-"));
writeFileSync(join(antdAppDirectory, "package.json"), JSON.stringify({ dependencies: { antd: "5.0.0" } }));
mkdirSync(join(antdAppDirectory, "src"));
const antdAppFile = join(antdAppDirectory, "src", "toolbar.tsx");

const ANTD_IMPORT = "import { Button } from 'antd';";

ruleTester.run("prefer-antd-flex", rule, {
  valid: [
    { code: '<div className="flex gap-2" />', filename: "toolbar.tsx" },
    { code: `${ANTD_IMPORT} const a = <div className="inline-flex md:flex flex-col" />;`, filename: "toolbar.tsx" },
    { code: `${ANTD_IMPORT} const a = <span className="flex gap-2" />;`, filename: "toolbar.tsx" },
    { code: `${ANTD_IMPORT} const a = <div className={styles.flex} />;`, filename: "toolbar.tsx" },
    {
      code: `${ANTD_IMPORT} import { Flex } from 'antd'; const a = <Flex gap={8} className="p-4" />;`,
      filename: "toolbar.tsx",
    },
  ],
  invalid: [
    {
      code: `${ANTD_IMPORT} const a = <div className="flex items-center gap-2 p-4" />;`,
      filename: "toolbar.tsx",
      errors: [{ messageId: "preferFlex" }],
    },
    {
      code: `${ANTD_IMPORT} const a = <div className={\`flex \${extra}\`} />;`,
      filename: "toolbar.tsx",
      errors: [{ messageId: "preferFlex" }],
    },
    {
      code: `${ANTD_IMPORT} const a = <div className={cn("flex flex-col", isActive && "bg-blue-50")} />;`,
      filename: "toolbar.tsx",
      errors: [{ messageId: "preferFlex" }],
    },
    {
      code: `${ANTD_IMPORT} const a = <div className={isOpen ? "flex" : "hidden"} />;`,
      filename: "toolbar.tsx",
      errors: [{ messageId: "preferFlex" }],
    },
    {
      code: '<div className="flex justify-between">{children}</div>',
      filename: antdAppFile,
      errors: [{ messageId: "preferFlex" }],
    },
  ],
});
