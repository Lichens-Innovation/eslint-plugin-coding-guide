import type { TSESTree } from "@typescript-eslint/utils";

import { functionReturnsJsx } from "../ast-utils.js";
import { createRule } from "../create-rule.js";

type FunctionLike = TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression | TSESTree.FunctionDeclaration;

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

interface CollectFromExportDefaultArgs {
  found: ComponentDecl[];
  statement: TSESTree.ExportDefaultDeclaration;
}

const isTsxFile = (filename: string): boolean => filename.replaceAll("\\", "/").endsWith(".tsx");

const isHookName = (name: string): boolean => /^use[A-Z]/.test(name);

const isComponentName = (name: string): boolean => /^[A-Z]/.test(name) && !isHookName(name);

const getFunctionLike = (init?: TSESTree.Expression | null): FunctionLike | null => {
  if (init?.type === "ArrowFunctionExpression" || init?.type === "FunctionExpression") return init;
  return null;
};

const tryAddComponent = ({ found, node, name }: TryAddComponentArgs): void => {
  if (!name || !isComponentName(name)) return;
  if (!functionReturnsJsx(node)) return;
  found.push({ node, name });
};

const collectFromFunctionDeclaration = ({ found, node }: CollectFromFunctionDeclarationArgs): void => {
  tryAddComponent({ found, node, name: node.id?.name });
};

const collectFromVariableDeclaration = ({ found, declaration }: CollectFromVariableDeclarationArgs): void => {
  for (const declarator of declaration.declarations) {
    if (declarator.id.type !== "Identifier") continue;
    const functionLike = getFunctionLike(declarator.init);
    if (functionLike) tryAddComponent({ found, node: functionLike, name: declarator.id.name });
  }
};

const collectFromExportDefault = ({ found, statement }: CollectFromExportDefaultArgs): void => {
  const { declaration } = statement;
  if (declaration.type === "FunctionDeclaration") {
    tryAddComponent({ found, node: declaration, name: declaration.id?.name ?? "default export" });
    return;
  }
  if (declaration.type === "ArrowFunctionExpression" || declaration.type === "FunctionExpression") {
    tryAddComponent({ found, node: declaration, name: "default export" });
  }
};

const collectModuleLevelComponents = (programBody: readonly TSESTree.ProgramStatement[]): ComponentDecl[] => {
  const found: ComponentDecl[] = [];

  for (const statement of programBody) {
    if (statement.type === "FunctionDeclaration") {
      collectFromFunctionDeclaration({ found, node: statement });
      continue;
    }

    if (statement.type === "VariableDeclaration") {
      collectFromVariableDeclaration({ found, declaration: statement });
      continue;
    }

    if (statement.type === "ExportDefaultDeclaration") {
      collectFromExportDefault({ found, statement });
      continue;
    }

    if (statement.type !== "ExportNamedDeclaration" || !statement.declaration) continue;

    if (statement.declaration.type === "FunctionDeclaration") {
      collectFromFunctionDeclaration({ found, node: statement.declaration });
      continue;
    }

    if (statement.declaration.type === "VariableDeclaration") {
      collectFromVariableDeclaration({ found, declaration: statement.declaration });
    }
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
    return {
      "Program:exit"(program: TSESTree.Program) {
        if (!isTsxFile(context.filename)) return;

        const components = collectModuleLevelComponents(program.body);
        if (components.length <= 1) return;

        const [primary, ...extras] = components;
        for (const { node, name } of extras) {
          context.report({
            node,
            messageId: "extraComponent",
            data: { existing: primary.name, name },
          });
        }
      },
    };
  },
});
