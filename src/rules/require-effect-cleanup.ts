import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";
import {
  getChildNodes,
  isFunctionNode,
  isIdentifierCall,
  isInlineFunction,
  type InlineFunction,
} from "../utils/ast.utils.js";

const RISKY_CALL_NAMES = new Set(["setInterval", "setTimeout", "addEventListener", "subscribe"]);

type BlockBodyCallback = InlineFunction & { body: TSESTree.BlockStatement };

const getCalleeName = (callee: TSESTree.Expression): string | null => {
  if (callee.type === "Identifier") return callee.name;
  if (callee.type === "MemberExpression" && callee.property.type === "Identifier") return callee.property.name;
  return null;
};

const isRiskyRegistration = (node: TSESTree.Node): boolean =>
  node.type === "CallExpression" && RISKY_CALL_NAMES.has(getCalleeName(node.callee) ?? "");

const containsRiskyRegistration = (node: TSESTree.Node): boolean => {
  if (isRiskyRegistration(node)) return true;
  // Nested functions are independently scoped — their registrations are not the effect's.
  if (isFunctionNode(node)) return false;

  return getChildNodes(node).some(containsRiskyRegistration);
};

const hasCleanupReturn = (blockStatement: TSESTree.BlockStatement): boolean =>
  blockStatement.body.some((statement) => statement.type === "ReturnStatement" && isInlineFunction(statement.argument));

const getBlockBodyCallback = (node: TSESTree.CallExpression): BlockBodyCallback | null => {
  const [callback] = node.arguments;
  if (!isInlineFunction(callback) || callback.body.type !== "BlockStatement") return null;

  return callback as BlockBodyCallback;
};

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
        if (!isIdentifierCall({ node, name: "useEffect" })) return;

        const callback = getBlockBodyCallback(node);
        if (!callback) return;
        if (!containsRiskyRegistration(callback.body)) return;
        if (hasCleanupReturn(callback.body)) return;

        context.report({ node, messageId: "requireCleanup", data: { what: "interval/listener/subscription" } });
      },
    };
  },
});
