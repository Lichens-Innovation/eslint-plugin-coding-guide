import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";
import { isNegation } from "../utils/ast.utils.js";

interface BuildPositiveTernaryArgs {
  node: TSESTree.ConditionalExpression;
  test: TSESTree.UnaryExpression;
}

export default createRule({
  name: "prefer-positive-condition",
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer a positive condition in a ternary over a negated one with swapped branches",
    },
    fixable: "code",
    schema: [],
    messages: {
      preferPositive: "Negated ternary condition — swap the branches and drop the `!` instead.",
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    const buildPositiveTernary = ({ node, test }: BuildPositiveTernaryArgs): string => {
      const innerTest = sourceCode.getText(test.argument);
      const consequentText = sourceCode.getText(node.consequent);
      const alternateText = sourceCode.getText(node.alternate);

      return `${innerTest} ? ${alternateText} : ${consequentText}`;
    };

    return {
      ConditionalExpression(node) {
        const test = node.test;
        if (!isNegation(test)) return;

        context.report({
          node,
          messageId: "preferPositive",
          fix: (fixer) => fixer.replaceText(node, buildPositiveTernary({ node, test })),
        });
      },
    };
  },
});
