import { functionReturnsJsx } from "../ast-utils.js";
import { createRule } from "../create-rule.js";

const RENDER_NAME_RE = /^render/i;

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
        if (node.callee.type !== "Identifier" || node.callee.name !== "useCallback") return;

        const [callback] = node.arguments;
        if (!callback || (callback.type !== "ArrowFunctionExpression" && callback.type !== "FunctionExpression")) {
          return;
        }

        const declarator = node.parent.type === "VariableDeclarator" ? node.parent : null;
        const boundName = declarator?.id.type === "Identifier" ? declarator.id.name : "";

        if (!functionReturnsJsx(callback) && !RENDER_NAME_RE.test(boundName)) return;

        context.report({ node, messageId: "extractSubcomponent" });
      },
    };
  },
});
