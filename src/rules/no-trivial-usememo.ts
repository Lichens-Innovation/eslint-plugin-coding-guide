import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";
import { getChildNodes, isIdentifierCall } from "../utils/ast.utils.js";

const containsCallExpression = (node: TSESTree.Node): boolean => {
  if (["CallExpression", "NewExpression"].includes(node.type)) return true;
  return getChildNodes(node).some((child) => containsCallExpression(child));
};

const getReturnedExpression = (callback: TSESTree.ArrowFunctionExpression): TSESTree.Node | null | undefined => {
  if (callback.body.type !== "BlockStatement") return callback.body;
  return callback.body.body.find((statement) => statement.type === "ReturnStatement")?.argument;
};

export default createRule({
  name: "no-trivial-usememo",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow useMemo whose body has no function call (likely unnecessary memoization)",
    },
    schema: [],
    messages: {
      unnecessaryMemo: "useMemo body has no function call inside — likely too trivial to be worth memoizing.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (!isIdentifierCall({ node, name: "useMemo" })) return;

        const [callback] = node.arguments;
        if (!callback || callback.type !== "ArrowFunctionExpression") return;

        const returned = getReturnedExpression(callback);
        if (!returned || containsCallExpression(returned)) return;

        context.report({ node, messageId: "unnecessaryMemo" });
      },
    };
  },
});
