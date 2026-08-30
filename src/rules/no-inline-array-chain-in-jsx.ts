import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

const CHAINABLE_METHODS = new Set(["filter", "sort", "map", "reduce"]);

const countChainedArrayCalls = (node: TSESTree.Expression): number => {
  let count = 0;
  let current: TSESTree.Expression = node;

  while (current.type === "CallExpression") {
    const callee = current.callee;
    if (callee.type !== "MemberExpression" || callee.computed) break;
    if (callee.property.type !== "Identifier" || !CHAINABLE_METHODS.has(callee.property.name)) break;

    count += 1;
    if (callee.object.type === "Super") break;
    current = callee.object;
  }

  return count;
};

export default createRule({
  name: "no-inline-array-chain-in-jsx",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow chained array methods directly inside a JSX expression",
    },
    schema: [],
    messages: {
      precompute: "Chained {{count}} array methods inline in JSX — precompute the list with an imported helper.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      JSXExpressionContainer(node) {
        const expression = node.expression;
        if (expression.type !== "CallExpression") return;

        const count = countChainedArrayCalls(expression);
        if (count < 2) return;

        context.report({ node: expression, messageId: "precompute", data: { count } });
      },
    };
  },
});
