import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";
import { isUndefinedIdentifier } from "../utils/ast.utils.js";

const isFindCall = (node: TSESTree.Node): node is TSESTree.CallExpression =>
  node.type === "CallExpression" &&
  node.callee.type === "MemberExpression" &&
  !node.callee.computed &&
  node.callee.property.type === "Identifier" &&
  node.callee.property.name === "find";

const isEqualityOperator = (operator: string): boolean => operator === "!==" || operator === "===";

const getFindComparedToUndefined = (node: TSESTree.BinaryExpression): TSESTree.CallExpression | undefined => {
  const [findSide, otherSide] = node.left.type === "CallExpression" ? [node.left, node.right] : [node.right, node.left];
  if (!isFindCall(findSide) || !isUndefinedIdentifier(otherSide)) return undefined;

  return findSide;
};

interface ReportWithSomeArgs {
  node: TSESTree.Node;
  findCall: TSESTree.CallExpression;
  negate: boolean;
}

interface ToSomeCallTextArgs {
  sourceCode: Readonly<TSESLint.SourceCode>;
  findCall: TSESTree.CallExpression;
}

const toSomeCallText = ({ sourceCode, findCall }: ToSomeCallTextArgs): string => {
  const callee = findCall.callee as TSESTree.MemberExpression;
  const calleeText = sourceCode.getText(callee.object);
  const argsText = findCall.arguments.map((arg) => sourceCode.getText(arg)).join(", ");
  return `${calleeText}.some(${argsText})`;
};

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

    const reportWithSome = ({ node, findCall, negate }: ReportWithSomeArgs): void => {
      context.report({
        node,
        messageId: "preferSome",
        fix: (fixer) => {
          const someText = toSomeCallText({ sourceCode, findCall });
          return fixer.replaceText(node, negate ? `!${someText}` : someText);
        },
      });
    };

    return {
      BinaryExpression(node) {
        if (!isEqualityOperator(node.operator)) return;

        const findCall = getFindComparedToUndefined(node);
        if (!findCall) return;

        reportWithSome({ node, findCall, negate: node.operator === "===" });
      },
      UnaryExpression(node) {
        if (node.operator !== "!" || !node.prefix) return;
        if (!isFindCall(node.argument)) return;

        reportWithSome({ node, findCall: node.argument, negate: true });
      },
    };
  },
});
