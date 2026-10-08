import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";
import { isNullOrUndefined } from "../utils/ast.utils.js";

type ComparisonOperator = "!==" | "===";

interface CheckPairArgs {
  node: TSESTree.LogicalExpression;
  operator: ComparisonOperator;
  logicalOperator: "&&" | "||";
  messageId: "preferNotNullish" | "preferNullish";
}

interface ComparisonPair {
  left: TSESTree.BinaryExpression;
  right: TSESTree.BinaryExpression;
}

const isNullishComparisonWith =
  (operator: ComparisonOperator) =>
  (node: TSESTree.Expression): node is TSESTree.BinaryExpression =>
    node.type === "BinaryExpression" && node.operator === operator && isNullOrUndefined(node.right);

export default createRule({
  name: "prefer-nullish-helpers",
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer isNullish/!isNullish over a manual null-and-undefined comparison pair",
    },
    schema: [],
    messages: {
      preferNotNullish: "Manual `!== null && !== undefined` pair — use `!isNullish({{expr}})` instead.",
      preferNullish: "Manual `=== null || === undefined` pair — use `isNullish({{expr}})` instead.",
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    const getSharedComparedText = ({ left, right }: ComparisonPair): string | undefined => {
      const leftExpr = sourceCode.getText(left.left);
      return leftExpr === sourceCode.getText(right.left) ? leftExpr : undefined;
    };

    const checkPair = ({ node, operator, logicalOperator, messageId }: CheckPairArgs): void => {
      if (node.operator !== logicalOperator) return;

      const { left, right } = node;
      const isNullishComparison = isNullishComparisonWith(operator);
      if (!isNullishComparison(left) || !isNullishComparison(right)) return;

      const expr = getSharedComparedText({ left, right });
      if (expr === undefined) return;

      context.report({ node, messageId, data: { expr } });
    };

    return {
      LogicalExpression(node) {
        checkPair({ node, operator: "!==", logicalOperator: "&&", messageId: "preferNotNullish" });
        checkPair({ node, operator: "===", logicalOperator: "||", messageId: "preferNullish" });
      },
    };
  },
});
