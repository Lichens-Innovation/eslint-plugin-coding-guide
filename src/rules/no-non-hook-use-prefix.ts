import { isBlank } from "@lichens-innovation/ts-common";
import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";
import { getChildNodes, getDeclaratorName, type FunctionLike } from "../utils/ast.utils.js";
import { isHookName } from "../utils/react.utils.js";

interface CheckFunctionArgs {
  node: FunctionLike;
  name?: string;
}

const isHookCall = (node: TSESTree.Node): boolean =>
  node.type === "CallExpression" && node.callee.type === "Identifier" && isHookName(node.callee.name);

const callsAHook = (node: TSESTree.Node): boolean => isHookCall(node) || getChildNodes(node).some(callsAHook);

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
      if (isBlank(name) || !isHookName(name)) return;
      if (callsAHook(node.body)) return;

      context.report({ node, messageId: "misnamed", data: { name } });
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
