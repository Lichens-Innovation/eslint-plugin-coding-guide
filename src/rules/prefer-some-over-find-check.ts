import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

const isFindCall = (node: TSESTree.Node): node is TSESTree.CallExpression =>
  node.type === "CallExpression" &&
  node.callee.type === "MemberExpression" &&
  !node.callee.computed &&
  node.callee.property.type === "Identifier" &&
  node.callee.property.name === "find";

export default createRule({
  name: "prefer-some-over-find-check",
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer Array#some over comparing Array#find's result to undefined",
    },
    fixable: "code",
    schema: [],
    messages: {
      preferSome: "Use `.some(...)` instead of comparing `.find(...)` to undefined for an existence check.",
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    const toSomeCallText = (findCallNode: TSESTree.CallExpression): string => {
      const callee = findCallNode.callee as TSESTree.MemberExpression;
      const calleeText = sourceCode.getText(callee.object);
      const argsText = findCallNode.arguments.map((arg) => sourceCode.getText(arg)).join(", ");
      return `${calleeText}.some(${argsText})`;
    };

    return {
      BinaryExpression(node) {
        if (node.operator !== "!==" && node.operator !== "===") return;

        const [findSide, otherSide] =
          node.left.type === "CallExpression" ? [node.left, node.right] : [node.right, node.left];

        if (!isFindCall(findSide)) return;
        if (otherSide.type !== "Identifier" || otherSide.name !== "undefined") return;

        const negate = node.operator === "===";

        context.report({
          node,
          messageId: "preferSome",
          fix: (fixer) => {
            const someText = toSomeCallText(findSide);
            return fixer.replaceText(node, negate ? `!${someText}` : someText);
          },
        });
      },
      UnaryExpression(node) {
        if (node.operator !== "!" || !node.prefix) return;
        const findCall = node.argument;
        if (!isFindCall(findCall)) return;

        context.report({
          node,
          messageId: "preferSome",
          fix: (fixer) => fixer.replaceText(node, `!${toSomeCallText(findCall)}`),
        });
      },
    };
  },
});
