import { createRule } from "../create-rule.js";

export default createRule({
  name: "no-bind-this",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow `.bind(this)` — use an arrow function instead",
    },
    schema: [],
    messages: {
      bindThis: "Avoid `.bind(this)` — use an arrow function instead, e.g. `() => this.method()`.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        const { callee, arguments: args } = node;
        const isBindCall =
          callee.type === "MemberExpression" &&
          !callee.computed &&
          callee.property.type === "Identifier" &&
          callee.property.name === "bind";

        if (isBindCall && args[0]?.type === "ThisExpression") {
          context.report({ node, messageId: "bindThis" });
        }
      },
    };
  },
});
