import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";
import { isTypeWrapper, unwrapTypeExpression } from "../utils/ast.utils.js";

const DEFAULT_MAX = 2;

const ARITHMETIC_OPERATORS = new Set(["+", "-", "*", "/", "%", "**", "<<", ">>", ">>>", "&", "|", "^"]);

const COMPARISON_OPERATORS = new Set(["==", "!=", "===", "!==", "<", "<=", ">", ">="]);

interface Options {
  max?: number;
}

const isLogicalExpression = (node?: TSESTree.Node | null): node is TSESTree.LogicalExpression =>
  node?.type === "LogicalExpression";

const isOperandWrapper = (node: TSESTree.Node): boolean =>
  isTypeWrapper(node) || node.type === "AwaitExpression" || node.type === "ChainExpression";

const unwrapOperand = (node: TSESTree.Node): TSESTree.Node => {
  const unwrapped = unwrapTypeExpression(node);
  if (unwrapped.type === "AwaitExpression") return unwrapOperand(unwrapped.argument);
  if (unwrapped.type === "ChainExpression") return unwrapOperand(unwrapped.expression);
  return unwrapped;
};

const flattenMixedLogicalChain = (node: TSESTree.Node): TSESTree.Node[] => {
  const unwrapped = unwrapOperand(node);
  return isLogicalExpression(unwrapped)
    ? [...flattenMixedLogicalChain(unwrapped.left), ...flattenMixedLogicalChain(unwrapped.right)]
    : [unwrapped];
};

const isNestedInLogicalChain = (node: TSESTree.LogicalExpression): boolean => {
  let parent: TSESTree.Node | undefined = node.parent;

  while (parent && isOperandWrapper(parent)) {
    parent = parent.parent;
  }

  return isLogicalExpression(parent);
};

const isArithmetic = (node: TSESTree.Node): boolean =>
  node.type === "BinaryExpression" && ARITHMETIC_OPERATORS.has(node.operator);

const isComparisonOnArithmetic = (node: TSESTree.Node): boolean =>
  node.type === "BinaryExpression" &&
  COMPARISON_OPERATORS.has(node.operator) &&
  (isArithmetic(unwrapOperand(node.left)) || isArithmetic(unwrapOperand(node.right)));

const isAnchorOperand = (operand: TSESTree.Node): boolean => {
  const node = unwrapOperand(operand);
  return isArithmetic(node) || isComparisonOnArithmetic(node) || node.type === "ConditionalExpression";
};

const isCallWithArguments = (node: TSESTree.Node): boolean =>
  (node.type === "CallExpression" || node.type === "NewExpression") && node.arguments.length > 0;

const isComputedOperand = (operand: TSESTree.Node): boolean =>
  isAnchorOperand(operand) || isCallWithArguments(unwrapOperand(operand));

export default createRule<[Options], "tooComplexChain">({
  name: "max-conditional-chain-complexity",
  meta: {
    type: "suggestion",
    docs: {
      description: "Limit the number of computed operands mixed in a single `||` / `&&` / `??` chain",
    },
    schema: [
      {
        type: "object",
        properties: {
          max: { type: "integer", minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      tooComplexChain:
        "Conditional chain mixes {{count}} computed operands (max {{max}}) — extract each into a named const and branch with explicit `if` statements.",
    },
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const max = options.max ?? DEFAULT_MAX;

    return {
      LogicalExpression(node) {
        if (isNestedInLogicalChain(node)) return;

        const operands = flattenMixedLogicalChain(node);
        if (!operands.some(isAnchorOperand)) return;

        const count = operands.filter(isComputedOperand).length;
        if (count <= max) return;

        context.report({ node, messageId: "tooComplexChain", data: { count, max } });
      },
    };
  },
});
