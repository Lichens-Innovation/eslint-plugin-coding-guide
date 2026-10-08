import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";
import { isIdentifierCall, isInlineFunction, type InlineFunction } from "../utils/ast.utils.js";
import { functionReturnsJsx } from "../utils/react.utils.js";

const RENDER_NAME_RE = /^render/i;

const getBoundName = (node: TSESTree.CallExpression): string => {
  const declarator = node.parent.type === "VariableDeclarator" ? node.parent : null;
  return declarator?.id.type === "Identifier" ? declarator.id.name : "";
};

interface IsRenderCallbackArgs {
  node: TSESTree.CallExpression;
  callback: InlineFunction;
}

const isRenderCallback = ({ node, callback }: IsRenderCallbackArgs): boolean =>
  functionReturnsJsx(callback) || RENDER_NAME_RE.test(getBoundName(node));

export default createRule({
  name: "no-render-fn-in-usecallback",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow useCallback wrapping a JSX-returning or render*-named function",
    },
    schema: [],
    messages: {
      extractSubcomponent:
        "useCallback wraps a render function — extract a `<Component />` instead; reserve useCallback for event handlers.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (!isIdentifierCall({ node, name: "useCallback" })) return;

        const [callback] = node.arguments;
        if (!isInlineFunction(callback)) return;
        if (!isRenderCallback({ node, callback })) return;

        context.report({ node, messageId: "extractSubcomponent" });
      },
    };
  },
});
