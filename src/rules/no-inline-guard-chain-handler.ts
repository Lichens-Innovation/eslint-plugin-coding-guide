import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

const countAndChainOperands = (node: TSESTree.Expression): number => {
  if (node.type === "LogicalExpression" && node.operator === "&&") {
    return countAndChainOperands(node.left) + countAndChainOperands(node.right);
  }
  return 1;
};

export default createRule({
  name: "no-inline-guard-chain-handler",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow a JSX prop arrow whose body is a long && guard chain",
    },
    schema: [],
    messages: {
      extractHandler:
        "JSX prop arrow guards with a {{count}}-term `&&` chain — extract a named handler with early returns.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      JSXAttribute(node) {
        const container = node.value;
        if (container?.type !== "JSXExpressionContainer") return;

        const expression = container.expression;
        if (expression.type !== "ArrowFunctionExpression") return;
        if (expression.body.type !== "LogicalExpression" || expression.body.operator !== "&&") return;

        const count = countAndChainOperands(expression.body);
        if (count < 3) return;

        context.report({ node: expression, messageId: "extractHandler", data: { count } });
      },
    };
  },
});
