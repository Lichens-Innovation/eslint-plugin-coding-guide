import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

const GENERIC_BASENAMES = new Set(["utils", "types", "helpers", "constants", "config", "client", "index"]);

const KEBAB_SUFFIX_BY_NAME_SUFFIX = [
  { nameSuffix: "Page", kebabSuffix: "-page" },
  { nameSuffix: "Dialog", kebabSuffix: "-dialog" },
  { nameSuffix: "Provider", kebabSuffix: "-provider" },
];

const getBasename = (filename: string): string => {
  const withoutDir = filename.replaceAll("\\", "/").split("/").pop() ?? filename;
  return withoutDir.replace(/\.(tsx|ts|jsx|js)$/, "");
};

interface PrimaryExport {
  name: string;
  isFunctionLike: boolean;
}

const collectFromVariableDeclaration = (declaration: TSESTree.VariableDeclaration): PrimaryExport[] => {
  const found: PrimaryExport[] = [];
  for (const declarator of declaration.declarations) {
    if (declarator.id.type !== "Identifier") continue;
    const isFunctionLike =
      declarator.init?.type === "ArrowFunctionExpression" || declarator.init?.type === "FunctionExpression";
    found.push({ name: declarator.id.name, isFunctionLike });
  }
  return found;
};

const collectPrimaryValueExports = (programBody: readonly TSESTree.ProgramStatement[]): PrimaryExport[] => {
  const exportsFound: PrimaryExport[] = [];

  for (const statement of programBody) {
    if (statement.type !== "ExportNamedDeclaration" || !statement.declaration) continue;
    const declaration = statement.declaration;

    if (declaration.type === "FunctionDeclaration" && declaration.id) {
      exportsFound.push({ name: declaration.id.name, isFunctionLike: true });
      continue;
    }

    if (declaration.type === "ClassDeclaration" && declaration.id) {
      exportsFound.push({ name: declaration.id.name, isFunctionLike: false });
      continue;
    }

    if (declaration.type === "VariableDeclaration") {
      exportsFound.push(...collectFromVariableDeclaration(declaration));
    }
  }

  return exportsFound;
};

export default createRule({
  name: "filename-convention-by-export-shape",
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce filename conventions against a file's exported shape",
    },
    schema: [],
    messages: {
      genericBasename:
        "'{{basename}}' is a generic root-level filename — prefix it with its domain (e.g. '{{example}}').",
      hookFilename: "This file's sole export '{{name}}' is a hook — rename the file to start with 'use-'.",
      suffixFilename:
        "This file's sole export '{{name}}' ends in '{{nameSuffix}}' — rename the file to end with '{{kebabSuffix}}'.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      "Program:exit"(program: TSESTree.Program) {
        const basename = getBasename(context.filename);

        if (GENERIC_BASENAMES.has(basename.toLowerCase())) {
          context.report({
            node: program,
            messageId: "genericBasename",
            data: { basename, example: `<domain>.${basename}.ts` },
          });
        }

        const primaryExports = collectPrimaryValueExports(program.body);
        if (primaryExports.length !== 1) return;

        const [primary] = primaryExports;
        if (!primary.isFunctionLike) return;

        const { name } = primary;

        if (/^use[A-Z]/.test(name)) {
          if (!basename.startsWith("use-")) {
            context.report({ node: program, messageId: "hookFilename", data: { name } });
          }
          return;
        }

        for (const { nameSuffix, kebabSuffix } of KEBAB_SUFFIX_BY_NAME_SUFFIX) {
          if (!name.endsWith(nameSuffix)) continue;
          if (!basename.endsWith(kebabSuffix)) {
            context.report({ node: program, messageId: "suffixFilename", data: { name, nameSuffix, kebabSuffix } });
          }
          return;
        }
      },
    };
  },
});
