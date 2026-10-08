import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";
import { flattenLogicalChain } from "../utils/ast.utils.js";

const MIN_GUARD_CHAIN_LENGTH = 3;

const getInlineArrow = (node: TSESTree.JSXAttribute): TSESTree.ArrowFunctionExpression | undefined => {
  if (node.value?.type !== "JSXExpressionContainer") return undefined;
  const { expression } = node.value;
  return expression.type === "ArrowFunctionExpression" ? expression : undefined;
};

const isAndChain = (node: TSESTree.Node): node is TSESTree.LogicalExpression =>
  node.type === "LogicalExpression" && node.operator === "&&";

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
        const arrow = getInlineArrow(node);
        if (!arrow || !isAndChain(arrow.body)) return;

        const count = flattenLogicalChain({ node: arrow.body, operator: "&&" }).length;
        if (count < MIN_GUARD_CHAIN_LENGTH) return;

        context.report({ node: arrow, messageId: "extractHandler", data: { count } });
      },
    };
  },
});
