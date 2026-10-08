import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";
import { flattenLogicalChain } from "../utils/ast.utils.js";

const isOrExpression = (node: TSESTree.Node): node is TSESTree.LogicalExpression =>
  node.type === "LogicalExpression" && node.operator === "||";

const isEqualityToLiteral = (node: TSESTree.Expression): node is TSESTree.BinaryExpression =>
  node.type === "BinaryExpression" && ["===", "=="].includes(node.operator) && node.right.type === "Literal";

const getLiteralComparisons = (node: TSESTree.LogicalExpression): TSESTree.BinaryExpression[] | undefined => {
  const operands = flattenLogicalChain({ node, operator: "||" });
  if (operands.length < 2 || !operands.every(isEqualityToLiteral)) return undefined;

  return operands as TSESTree.BinaryExpression[];
};

interface IncludesTextArgs {
  comparisons: TSESTree.BinaryExpression[];
  lhsText: string;
}

export default createRule({
  name: "prefer-includes-over-or-chain",
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer Array#includes over a chain of === comparisons against the same value",
    },
    fixable: "code",
    schema: [],
    messages: {
      preferIncludes: "Repeated equality checks against the same value — use `[...].includes(...)` instead.",
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    const getSharedLhsText = (comparisons: TSESTree.BinaryExpression[]): string | undefined => {
      const lhsTexts = comparisons.map((comparison) => sourceCode.getText(comparison.left));
      const [firstLhs] = lhsTexts;
      return lhsTexts.every((text) => text === firstLhs) ? firstLhs : undefined;
    };

    const toIncludesText = ({ comparisons, lhsText }: IncludesTextArgs): string => {
      const literalsText = comparisons.map((comparison) => sourceCode.getText(comparison.right)).join(", ");
      return `[${literalsText}].includes(${lhsText})`;
    };

    return {
      LogicalExpression(node) {
        if (!isOrExpression(node) || isOrExpression(node.parent)) return;

        const comparisons = getLiteralComparisons(node);
        if (!comparisons) return;

        const lhsText = getSharedLhsText(comparisons);
        if (lhsText === undefined) return;

        context.report({
          node,
          messageId: "preferIncludes",
          fix: (fixer) => fixer.replaceText(node, toIncludesText({ comparisons, lhsText })),
        });
      },
    };
  },
});
