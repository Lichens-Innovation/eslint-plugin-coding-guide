import { isBlank } from "@lichens-innovation/ts-common";
import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";
import type { FunctionLike } from "../utils/ast.utils.js";
import { isTsxFile } from "../utils/file.utils.js";
import { functionReturnsJsx, isHookName, unwrapComponentFunction } from "../utils/react.utils.js";

interface ComponentDecl {
  node: TSESTree.Node;
  name: string;
}

interface TryAddComponentArgs {
  found: ComponentDecl[];
  node: FunctionLike;
  name?: string | null;
}

interface CollectFromFunctionDeclarationArgs {
  found: ComponentDecl[];
  node: TSESTree.FunctionDeclaration;
}

interface CollectFromVariableDeclarationArgs {
  found: ComponentDecl[];
  declaration: TSESTree.VariableDeclaration;
}

interface CollectFromDeclarationArgs {
  found: ComponentDecl[];
  declaration: TSESTree.Node;
}

interface CollectFromExportDefaultArgs {
  found: ComponentDecl[];
  statement: TSESTree.ExportDefaultDeclaration;
}

// Label of an anonymous default export: it has no name to check, its JSX return is enough.
const DEFAULT_EXPORT_NAME = "default export";

const isComponentName = (name: string): boolean =>
  name === DEFAULT_EXPORT_NAME || (/^[A-Z]/.test(name) && !isHookName(name));

const tryAddComponent = ({ found, node, name }: TryAddComponentArgs): void => {
  if (isBlank(name) || !isComponentName(name)) return;
  if (!functionReturnsJsx(node)) return;
  found.push({ node, name });
};

const collectFromFunctionDeclaration = ({ found, node }: CollectFromFunctionDeclarationArgs): void => {
  tryAddComponent({ found, node, name: node.id?.name });
};

const collectFromVariableDeclaration = ({ found, declaration }: CollectFromVariableDeclarationArgs): void => {
  for (const declarator of declaration.declarations) {
    const componentFunction = unwrapComponentFunction(declarator.init);
    if (declarator.id.type !== "Identifier" || !componentFunction) continue;
    tryAddComponent({ found, node: componentFunction, name: declarator.id.name });
  }
};

const collectFromExportDefault = ({ found, statement }: CollectFromExportDefaultArgs): void => {
  const { declaration } = statement;
  if (declaration.type === "FunctionDeclaration") {
    tryAddComponent({ found, node: declaration, name: declaration.id?.name ?? DEFAULT_EXPORT_NAME });
    return;
  }
  const componentFunction = unwrapComponentFunction(declaration);
  if (componentFunction) {
    tryAddComponent({ found, node: componentFunction, name: DEFAULT_EXPORT_NAME });
  }
};

const collectFromDeclaration = ({ found, declaration }: CollectFromDeclarationArgs): void => {
  if (declaration.type === "FunctionDeclaration") {
    collectFromFunctionDeclaration({ found, node: declaration });
    return;
  }
  if (declaration.type === "VariableDeclaration") {
    collectFromVariableDeclaration({ found, declaration });
  }
};

const unwrapNamedExport = (statement: TSESTree.ProgramStatement): TSESTree.Node | null => {
  if (statement.type !== "ExportNamedDeclaration") return statement;
  return statement.declaration;
};

const collectModuleLevelComponents = (programBody: readonly TSESTree.ProgramStatement[]): ComponentDecl[] => {
  const found: ComponentDecl[] = [];

  for (const statement of programBody) {
    if (statement.type === "ExportDefaultDeclaration") {
      collectFromExportDefault({ found, statement });
      continue;
    }

    const declaration = unwrapNamedExport(statement);
    if (declaration) collectFromDeclaration({ found, declaration });
  }

  return found;
};

export default createRule({
  name: "one-component-per-tsx-file",
  meta: {
    type: "suggestion",
    docs: {
      description: "Allow at most one React component per .tsx file",
    },
    schema: [],
    messages: {
      extraComponent: "This file already declares component '{{existing}}' — move '{{name}}' to its own .tsx file.",
    },
  },
  defaultOptions: [],
  create(context) {
    const reportExtraComponents = ([primary, ...extras]: ComponentDecl[]): void => {
      if (!primary) return;

      for (const { node, name } of extras) {
        context.report({
          node,
          messageId: "extraComponent",
          data: { existing: primary.name, name },
        });
      }
    };

    return {
      "Program:exit"(program: TSESTree.Program) {
        if (!isTsxFile(context.filename)) return;

        reportExtraComponents(collectModuleLevelComponents(program.body));
      },
    };
  },
});
