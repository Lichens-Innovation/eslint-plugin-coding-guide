import type { TSESTree } from "@typescript-eslint/utils";

import { getChildNodes } from "../ast-utils.js";
import { createRule } from "../create-rule.js";

const HOOK_NAME_RE = /^use[A-Z]/;

type FunctionLike = TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression;

interface CheckFunctionArgs {
  node: FunctionLike;
  name?: string;
}

const callsAHook = (node: TSESTree.Node): boolean => {
  if (node.type === "CallExpression" && node.callee.type === "Identifier" && HOOK_NAME_RE.test(node.callee.name)) {
    return true;
  }

  return getChildNodes(node).some((child) => callsAHook(child));
};

export default createRule({
  name: "no-non-hook-use-prefix",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow a use* named function whose body calls no hook",
    },
    schema: [],
    messages: {
      misnamed: "'{{name}}' is named like a hook but calls no hook internally — rename it to a plain action verb.",
    },
  },
  defaultOptions: [],
  create(context) {
    const checkFunction = ({ node, name }: CheckFunctionArgs): void => {
      if (!name || !HOOK_NAME_RE.test(name)) return;
      if (callsAHook(node.body)) return;

      context.report({ node, messageId: "misnamed", data: { name } });
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
