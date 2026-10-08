import { existsSync, readdirSync } from "node:fs";
import { basename, dirname, extname, matchesGlob } from "node:path";

import { createRule } from "../create-rule.js";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mts", ".cts"]);

// Companion files (tests, stories, type declarations) and barrels travel with the
// code they describe, so they don't count as distinct units of the folder.
const COMPANION_FILE_PATTERN = /\.(test|spec|stories)\.[^.]+$|\.d\.[cm]?ts$|^index\.[^.]+$/;

const DEFAULT_MAX = 20;

interface Options {
  max?: number;
  ignoreFolders?: string[];
}

const isCountedSourceFile = (fileName: string): boolean =>
  SOURCE_EXTENSIONS.has(extname(fileName)) && !COMPANION_FILE_PATTERN.test(fileName);

const countSourceFiles = (folder: string): number =>
  readdirSync(folder, { withFileTypes: true }).filter((entry) => entry.isFile() && isCountedSourceFile(entry.name))
    .length;

export default createRule<[Options], "tooManyFiles">({
  name: "max-files-per-folder",
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce a maximum number of source files per folder",
    },
    schema: [
      {
        type: "object",
        properties: {
          max: { type: "integer", minimum: 1 },
          ignoreFolders: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      tooManyFiles:
        "Folder `{{folder}}` contains {{count}} source files. Maximum allowed is {{max}} — group related files into sub-folders.",
    },
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const max = options.max ?? DEFAULT_MAX;
    const ignoreFolders = options.ignoreFolders ?? [];

    return {
      Program(node) {
        const filename = context.filename.replaceAll("\\", "/");
        if (!isCountedSourceFile(basename(filename))) return;

        const folder = dirname(filename);
        if (!existsSync(folder)) return;
        if (ignoreFolders.some((pattern) => matchesGlob(folder, pattern))) return;

        const count = countSourceFiles(folder);
        if (count <= max) return;

        context.report({ node, messageId: "tooManyFiles", data: { folder: basename(folder), count, max } });
      },
    };
  },
});
