import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

const HOOK_NAMES = new Set(["useState", "useRef"]);

const hasTypeArguments = (node: TSESTree.CallExpression): boolean => {
  const typeArgs = node.typeArguments;
  return !!typeArgs && typeArgs.params.length > 0;
};

const hasUninferableInitialValue = (node: TSESTree.CallExpression): boolean => {
  if (node.arguments.length === 0) return true;
  const [arg] = node.arguments;
  return (arg.type === "Literal" && arg.value === null) || (arg.type === "Identifier" && arg.name === "undefined");
};

export default createRule({
  name: "require-usestate-useref-generic",
  meta: {
    type: "suggestion",
    docs: {
      description: "Require an explicit generic on useState()/useRef() when the initial value can't infer one",
    },
    schema: [],
    messages: {
      requireGeneric: "'{{name}}()' has no inferable type from its initial value — add an explicit `<Type>` generic.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== "Identifier" || !HOOK_NAMES.has(node.callee.name)) return;
        if (hasTypeArguments(node)) return;
        if (!hasUninferableInitialValue(node)) return;

        context.report({ node, messageId: "requireGeneric", data: { name: node.callee.name } });
      },
    };
  },
});
