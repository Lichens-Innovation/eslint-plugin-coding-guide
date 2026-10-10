import { isBlank } from "@lichens-innovation/ts-common";
import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";
import { isInlineFunction } from "../utils/ast.utils.js";
import { toPosixPath } from "../utils/file.utils.js";

const GENERIC_BASENAMES = new Set(["utils", "types", "helpers", "constants", "config", "client", "index"]);

const KEBAB_SUFFIX_BY_NAME_SUFFIX = [
  { nameSuffix: "Page", kebabSuffix: "-page" },
  { nameSuffix: "Dialog", kebabSuffix: "-dialog" },
  { nameSuffix: "Provider", kebabSuffix: "-provider" },
];

const SOURCE_EXTENSION_PATTERN = /\.(tsx|ts|jsx|js)$/;

const getFileName = (filename: string): string => toPosixPath(filename).split("/").pop() ?? filename;

const getBasename = (filename: string): string => getFileName(filename).replace(SOURCE_EXTENSION_PATTERN, "");

const getExtension = (filename: string): string => SOURCE_EXTENSION_PATTERN.exec(getFileName(filename))?.[0] ?? ".ts";

interface PrimaryExport {
  name: string;
  isFunctionLike: boolean;
}

const collectFromVariableDeclaration = (declaration: TSESTree.VariableDeclaration): PrimaryExport[] =>
  declaration.declarations.flatMap((declarator) =>
    declarator.id.type === "Identifier"
      ? [{ name: declarator.id.name, isFunctionLike: isInlineFunction(declarator.init) }]
      : []
  );

const collectFromDeclaration = (declaration: TSESTree.NamedExportDeclarations): PrimaryExport[] => {
  if (declaration.type === "FunctionDeclaration" && declaration.id) {
    return [{ name: declaration.id.name, isFunctionLike: true }];
  }
  if (declaration.type === "ClassDeclaration" && declaration.id) {
    return [{ name: declaration.id.name, isFunctionLike: false }];
  }
  if (declaration.type === "VariableDeclaration") return collectFromVariableDeclaration(declaration);
  return [];
};

const collectPrimaryValueExports = (programBody: readonly TSESTree.ProgramStatement[]): PrimaryExport[] =>
  programBody.flatMap((statement) =>
    statement.type === "ExportNamedDeclaration" && statement.declaration
      ? collectFromDeclaration(statement.declaration)
      : []
  );

const getSoleFunctionExportName = (program: TSESTree.Program): string | undefined => {
  const primaryExports = collectPrimaryValueExports(program.body);
  if (primaryExports.length !== 1) return undefined;

  const [primary] = primaryExports;
  return primary.isFunctionLike ? primary.name : undefined;
};

type MessageId = "genericBasename" | "hookFilename" | "suffixFilename";

interface FilenameCheckArgs {
  context: Readonly<TSESLint.RuleContext<MessageId, []>>;
  program: TSESTree.Program;
  basename: string;
}

interface GenericBasenameCheckArgs extends FilenameCheckArgs {
  extension: string;
}

interface ExportFilenameCheckArgs extends FilenameCheckArgs {
  name: string;
}

const checkGenericBasename = ({ context, program, basename, extension }: GenericBasenameCheckArgs): void => {
  if (!GENERIC_BASENAMES.has(basename.toLowerCase())) return;

  context.report({
    node: program,
    messageId: "genericBasename",
    data: { basename, example: `<domain>.${basename}${extension}` },
  });
};

const checkHookFilename = ({ context, program, basename, name }: ExportFilenameCheckArgs): void => {
  if (basename.startsWith("use-")) return;

  context.report({ node: program, messageId: "hookFilename", data: { name } });
};

const checkSuffixFilename = ({ context, program, basename, name }: ExportFilenameCheckArgs): void => {
  const match = KEBAB_SUFFIX_BY_NAME_SUFFIX.find(({ nameSuffix }) => name.endsWith(nameSuffix));
  if (!match || basename.endsWith(match.kebabSuffix)) return;

  context.report({ node: program, messageId: "suffixFilename", data: { name, ...match } });
};

const checkSoleExportFilename = (args: FilenameCheckArgs): void => {
  const name = getSoleFunctionExportName(args.program);
  if (isBlank(name)) return;

  if (/^use[A-Z]/.test(name)) {
    checkHookFilename({ ...args, name });
    return;
  }

  checkSuffixFilename({ ...args, name });
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
      genericBasename: "'{{basename}}' is a generic filename — prefix it with its domain (e.g. '{{example}}').",
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

        checkGenericBasename({ context, program, basename, extension: getExtension(context.filename) });
        checkSoleExportFilename({ context, program, basename });
      },
    };
  },
});
