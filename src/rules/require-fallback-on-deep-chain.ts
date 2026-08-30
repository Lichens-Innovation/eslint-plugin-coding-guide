import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

export interface Options {
  minDepth?: number;
}

const countOptionalDepth = (node: TSESTree.Node): number => {
  let depth = 0;
  let current: TSESTree.Node = node;

  while (current.type === "MemberExpression" || current.type === "CallExpression") {
    if (current.optional) depth += 1;
    current = current.type === "CallExpression" ? current.callee : current.object;
  }

  return depth;
};

const endsWithNullishFallback = (node: TSESTree.ChainExpression): boolean =>
  node.parent.type === "LogicalExpression" && node.parent.operator === "??" && node.parent.left === node;

export default createRule<[Options], "requireFallback">({
  name: "require-fallback-on-deep-chain",
  meta: {
    type: "suggestion",
    docs: {
      description: "Require a ?? fallback on a deep optional chain",
    },
    schema: [
      {
        type: "object",
        properties: { minDepth: { type: "integer", minimum: 2 } },
        additionalProperties: false,
      },
    ],
    messages: {
      requireFallback: "Optional chain is {{depth}} levels deep with no `?? fallback` — add one.",
    },
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const minDepth = options.minDepth ?? 3;

    return {
      ChainExpression(node) {
        const depth = countOptionalDepth(node.expression);
        if (depth < minDepth) return;
        if (endsWithNullishFallback(node)) return;

        context.report({ node, messageId: "requireFallback", data: { depth } });
      },
    };
  },
});
