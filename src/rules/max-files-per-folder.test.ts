import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll } from "vitest";

import { ruleTester } from "../rule-tester.js";
import rule from "./max-files-per-folder.js";

const root = mkdtempSync(join(tmpdir(), "max-files-per-folder-"));

interface CreateFolderArgs {
  name: string;
  fileNames: string[];
}

const createFolder = ({ name, fileNames }: CreateFolderArgs): string => {
  const folder = join(root, name);
  mkdirSync(folder, { recursive: true });
  fileNames.forEach((fileName) => writeFileSync(join(folder, fileName), ""));
  return folder;
};

const sourceFiles = (count: number): string[] => Array.from({ length: count }, (_, index) => `file-${index}.ts`);

const atLimit = createFolder({ name: "at-limit", fileNames: sourceFiles(20) });
const overLimit = createFolder({ name: "over-limit", fileNames: sourceFiles(21) });
const withCompanions = createFolder({
  name: "with-companions",
  fileNames: [
    ...sourceFiles(20),
    "file-0.test.ts",
    "file-1.spec.tsx",
    "file-2.stories.tsx",
    "types.d.ts",
    "index.ts",
    "styles.css",
    "data.json",
  ],
});
const generated = createFolder({ name: "generated", fileNames: sourceFiles(21) });

afterAll(() => rmSync(root, { recursive: true, force: true }));

const code = "export const value = 1;";

ruleTester.run("max-files-per-folder", rule, {
  valid: [
    // exactly at the default max of 20
    { code, filename: join(atLimit, "file-0.ts") },
    // tests, stories, declarations, barrels and non-source files are not counted
    { code, filename: join(withCompanions, "file-0.ts") },
    // companion files themselves are never reported
    { code, filename: join(overLimit, "file-0.test.ts") },
    // folder matched by ignoreFolders
    { code, filename: join(generated, "file-0.ts"), options: [{ ignoreFolders: ["**/generated"] }] },
    // custom max
    { code, filename: join(overLimit, "file-0.ts"), options: [{ max: 25 }] },
  ],
  invalid: [
    {
      code,
      filename: join(overLimit, "file-0.ts"),
      errors: [{ messageId: "tooManyFiles", data: { folder: "over-limit", count: 21, max: 20 } }],
    },
    {
      code,
      filename: join(atLimit, "file-0.ts"),
      options: [{ max: 10 }],
      errors: [{ messageId: "tooManyFiles", data: { folder: "at-limit", count: 20, max: 10 } }],
    },
  ],
});
