import type { TSESTree } from "@typescript-eslint/utils";

import { getChildNodes } from "../ast-utils.js";
import { createRule } from "../create-rule.js";

const HOOK_NAME_RE = /^use[A-Z]/;

type FunctionLike = TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression;

interface CheckFunctionArgs {
  node: FunctionLike;
  name?: string;
}

const isJsxReturn = (node: TSESTree.ReturnStatement): boolean =>
  node.argument?.type === "JSXElement" || node.argument?.type === "JSXFragment";

const returnsJsxDirectly = (functionNode: FunctionLike): boolean => {
  let found = false;

  const visit = (node: TSESTree.Node): void => {
    if (found) return;
    if (
      node !== functionNode &&
      ["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(node.type)
    ) {
      return; // don't descend into nested function bodies
    }

    if (node.type === "ReturnStatement" && isJsxReturn(node)) {
      found = true;
      return;
    }

    for (const child of getChildNodes(node)) visit(child);
  };

  if (["JSXElement", "JSXFragment"].includes(functionNode.body.type)) return true;
  visit(functionNode.body);
  return found;
};

export default createRule({
  name: "no-hook-returning-jsx",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow a use* hook returning JSX",
    },
    schema: [],
    messages: {
      hookReturnsJsx: "'{{name}}' is named like a hook but returns JSX — hooks should return data, not markup.",
    },
  },
  defaultOptions: [],
  create(context) {
    const checkFunction = ({ node, name }: CheckFunctionArgs): void => {
      if (!name || !HOOK_NAME_RE.test(name)) return;
      if (!returnsJsxDirectly(node)) return;

      context.report({ node, messageId: "hookReturnsJsx", data: { name } });
    };

    return {
      FunctionDeclaration(node) {
        checkFunction({ node, name: node.id?.name });
      },
      "VariableDeclarator > ArrowFunctionExpression"(node: TSESTree.ArrowFunctionExpression) {
        const declarator = node.parent as TSESTree.VariableDeclarator;
        checkFunction({ node, name: declarator.id.type === "Identifier" ? declarator.id.name : undefined });
      },
    };
  },
});
