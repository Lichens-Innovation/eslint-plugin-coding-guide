import { createRule } from "../create-rule.js";

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

    return {
      ConditionalExpression(node) {
        const test = node.test;
        if (test.type !== "UnaryExpression" || test.operator !== "!" || !test.prefix) return;

        context.report({
          node,
          messageId: "preferPositive",
          fix: (fixer) => {
            const innerTest = sourceCode.getText(test.argument);
            const consequentText = sourceCode.getText(node.consequent);
            const alternateText = sourceCode.getText(node.alternate);
            return fixer.replaceText(node, `${innerTest} ? ${alternateText} : ${consequentText}`);
          },
        });
      },
    };
  },
});
