import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

const RISKY_CALL_NAMES = new Set(["setInterval", "setTimeout", "addEventListener", "subscribe"]);

const isAstNode = (value: unknown): value is TSESTree.Node =>
  !!value && typeof value === "object" && typeof (value as { type?: unknown }).type === "string";

const isRiskyRegistration = (node: TSESTree.Node): boolean => {
  if (node.type !== "CallExpression") return false;
  if (node.callee.type === "Identifier") return RISKY_CALL_NAMES.has(node.callee.name);
  if (node.callee.type === "MemberExpression" && node.callee.property.type === "Identifier") {
    return RISKY_CALL_NAMES.has(node.callee.property.name);
  }
  return false;
};

/** Don't descend into nested (already independently-scoped) functions. */
const containsRiskyRegistration = (node: unknown): boolean => {
  if (!isAstNode(node)) return false;
  if (isRiskyRegistration(node)) return true;
  if (["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(node.type)) {
    return false;
  }

  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    const value = (node as unknown as Record<string, unknown>)[key];
    const matches = Array.isArray(value)
      ? value.some((child) => containsRiskyRegistration(child))
      : containsRiskyRegistration(value);
    if (matches) return true;
  }

  return false;
};

const hasCleanupReturn = (blockStatement: TSESTree.BlockStatement): boolean =>
  blockStatement.body.some(
    (statement) =>
      statement.type === "ReturnStatement" &&
      statement.argument !== null &&
      ["ArrowFunctionExpression", "FunctionExpression"].includes(statement.argument.type)
  );

export default createRule({
  name: "require-effect-cleanup",
  meta: {
    type: "suggestion",
    docs: {
      description: "Require a cleanup return from a useEffect that registers a timer/listener/subscription",
    },
    schema: [],
    messages: {
      requireCleanup: "This effect registers a {{what}} but returns no cleanup function to tear it down.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== "Identifier" || node.callee.name !== "useEffect") return;

        const [callback] = node.arguments;
        if (
          !callback ||
          (callback.type !== "ArrowFunctionExpression" && callback.type !== "FunctionExpression") ||
          callback.body.type !== "BlockStatement"
        ) {
          return;
        }
        if (!containsRiskyRegistration(callback.body)) return;
        if (hasCleanupReturn(callback.body)) return;

        context.report({ node, messageId: "requireCleanup", data: { what: "interval/listener/subscription" } });
      },
    };
  },
});
