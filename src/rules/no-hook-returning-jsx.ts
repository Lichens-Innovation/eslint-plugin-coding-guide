import { isBlank } from "@lichens-innovation/ts-common";
import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";
import { getChildNodes, getDeclaratorName, isFunctionNode, isJsxNode, type FunctionLike } from "../utils/ast.utils.js";
import { isHookName } from "../utils/react.utils.js";

interface CheckFunctionArgs {
  node: FunctionLike;
  name?: string;
}

const containsJsxReturn = (node: TSESTree.Node): boolean => {
  if (node.type === "ReturnStatement" && isJsxNode(node.argument)) return true;

  return getChildNodes(node).some((child) => !isFunctionNode(child) && containsJsxReturn(child));
};

const returnsJsxDirectly = (functionNode: FunctionLike): boolean => {
  if (isJsxNode(functionNode.body)) return true;

  return containsJsxReturn(functionNode.body);
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
      if (isBlank(name) || !isHookName(name)) return;
      if (!returnsJsxDirectly(node)) return;

      context.report({ node, messageId: "hookReturnsJsx", data: { name } });
    };

    return {
      FunctionDeclaration(node) {
        checkFunction({ node, name: node.id?.name });
      },
      "VariableDeclarator > ArrowFunctionExpression"(node: TSESTree.ArrowFunctionExpression) {
        checkFunction({ node, name: getDeclaratorName(node.parent as TSESTree.VariableDeclarator) });
      },
    };
  },
});
