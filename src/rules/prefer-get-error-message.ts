import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

const ERROR_CLASS_NAME = "Error";
const MESSAGE_PROPERTY = "message";

/** `x instanceof Error` → `x` */
const getInstanceofErrorSubject = (node: TSESTree.Expression): TSESTree.Expression | undefined => {
  if (node.type !== "BinaryExpression" || node.operator !== "instanceof") return undefined;
  if (node.right.type !== "Identifier" || node.right.name !== ERROR_CLASS_NAME) return undefined;
  return node.left;
};

/** `x.message` / `x?.message` → `x` */
const getMessageSubject = (node: TSESTree.Expression): TSESTree.Expression | undefined => {
  const inner = node.type === "ChainExpression" ? node.expression : node;
  if (inner.type !== "MemberExpression" || inner.computed) return undefined;
  if (inner.property.type !== "Identifier" || inner.property.name !== MESSAGE_PROPERTY) return undefined;
  return inner.object;
};

interface ResolvedCheck {
  subject: TSESTree.Expression;
  messageBranch: TSESTree.Expression;
}

/** Resolves `x instanceof Error ? x.message : …` and its negated `!(x instanceof Error) ? … : x.message` form. */
const resolveCheck = (node: TSESTree.ConditionalExpression): ResolvedCheck | undefined => {
  const isNegated = node.test.type === "UnaryExpression" && node.test.operator === "!";
  const test = isNegated && node.test.type === "UnaryExpression" ? node.test.argument : node.test;
  const subject = getInstanceofErrorSubject(test);
  if (!subject) return undefined;

  return { subject, messageBranch: isNegated ? node.alternate : node.consequent };
};

export default createRule({
  name: "prefer-get-error-message",
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer getErrorMessage(error) over a manual `error instanceof Error ? error.message : …` ternary",
    },
    schema: [],
    messages: {
      preferGetErrorMessage:
        "Manual `instanceof Error` message extraction — use `getErrorMessage({{expr}})` from @lichens-innovation/ts-common (handles Error, string and unknown values).",
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      ConditionalExpression(node) {
        const check = resolveCheck(node);
        if (!check) return;

        const messageSubject = getMessageSubject(check.messageBranch);
        if (!messageSubject) return;

        const expr = sourceCode.getText(check.subject);
        if (sourceCode.getText(messageSubject) !== expr) return;

        context.report({ node, messageId: "preferGetErrorMessage", data: { expr } });
      },
    };
  },
});
