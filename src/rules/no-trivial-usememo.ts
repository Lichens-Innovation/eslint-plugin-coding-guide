import type { TSESTree } from "@typescript-eslint/utils";

import { getChildNodes } from "../ast-utils.js";
import { createRule } from "../create-rule.js";

const containsCallExpression = (node: TSESTree.Node): boolean => {
  if (["CallExpression", "NewExpression"].includes(node.type)) return true;
  return getChildNodes(node).some((child) => containsCallExpression(child));
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
        if (node.callee.type !== "Identifier" || node.callee.name !== "useMemo") return;

        const [callback] = node.arguments;
        if (!callback || callback.type !== "ArrowFunctionExpression") return;

        const bodyToCheck =
          callback.body.type === "BlockStatement"
            ? callback.body.body.find((statement) => statement.type === "ReturnStatement")?.argument
            : callback.body;

        if (!bodyToCheck) return;
        if (containsCallExpression(bodyToCheck)) return;

        context.report({ node, messageId: "unnecessaryMemo" });
      },
    };
  },
});
