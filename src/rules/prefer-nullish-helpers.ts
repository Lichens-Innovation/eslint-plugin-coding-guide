import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

const isNullOrUndefinedLiteral = (node: TSESTree.Expression): boolean =>
  (node.type === "Literal" && node.value === null) || (node.type === "Identifier" && node.name === "undefined");

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

    interface CheckPairArgs {
      node: TSESTree.LogicalExpression;
      operator: "!==" | "===";
      logicalOperator: "&&" | "||";
      messageId: "preferNotNullish" | "preferNullish";
    }

    const checkPair = ({ node, operator, logicalOperator, messageId }: CheckPairArgs): void => {
      if (node.operator !== logicalOperator) return;

      const matchesNullishComparison = (side: TSESTree.Expression): side is TSESTree.BinaryExpression =>
        side.type === "BinaryExpression" && side.operator === operator && isNullOrUndefinedLiteral(side.right);

      if (!matchesNullishComparison(node.left)) return;
      if (!matchesNullishComparison(node.right)) return;

      const leftExpr = sourceCode.getText(node.left.left);
      const rightExpr = sourceCode.getText(node.right.left);
      if (leftExpr !== rightExpr) return;

      context.report({
        node,
        messageId,
        data: { expr: leftExpr },
      });
    };

    return {
      LogicalExpression(node) {
        checkPair({ node, operator: "!==", logicalOperator: "&&", messageId: "preferNotNullish" });
        checkPair({ node, operator: "===", logicalOperator: "||", messageId: "preferNullish" });
      },
    };
  },
});
