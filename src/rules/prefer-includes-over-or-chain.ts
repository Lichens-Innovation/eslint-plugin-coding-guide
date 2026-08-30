import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

const flattenOrChain = (node: TSESTree.Expression): TSESTree.Expression[] => {
  if (node.type === "LogicalExpression" && node.operator === "||") {
    return [...flattenOrChain(node.left), ...flattenOrChain(node.right)];
  }

  return [node];
};

const isEqualityToLiteral = (node: TSESTree.Expression): node is TSESTree.BinaryExpression =>
  node.type === "BinaryExpression" && ["===", "=="].includes(node.operator) && node.right.type === "Literal";

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

    return {
      LogicalExpression(node) {
        if (node.operator !== "||") return;
        if (node.parent.type === "LogicalExpression" && node.parent.operator === "||") return; // only report the outermost chain

        const operands = flattenOrChain(node);
        if (operands.length < 2) return;
        if (!operands.every(isEqualityToLiteral)) return;

        const binaryOperands = operands as TSESTree.BinaryExpression[];
        const lhsTexts = binaryOperands.map((operand) => sourceCode.getText(operand.left));
        const [firstLhs] = lhsTexts;
        if (!lhsTexts.every((text) => text === firstLhs)) return;

        context.report({
          node,
          messageId: "preferIncludes",
          fix: (fixer) => {
            const literalsText = binaryOperands.map((operand) => sourceCode.getText(operand.right)).join(", ");
            return fixer.replaceText(node, `[${literalsText}].includes(${firstLhs})`);
          },
        });
      },
    };
  },
});
