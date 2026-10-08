import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

const isBindMember = (callee: TSESTree.Expression): boolean =>
  callee.type === "MemberExpression" &&
  !callee.computed &&
  callee.property.type === "Identifier" &&
  callee.property.name === "bind";

const isBindThisCall = (node: TSESTree.CallExpression): boolean =>
  isBindMember(node.callee) && node.arguments[0]?.type === "ThisExpression";

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
        if (!isBindThisCall(node)) return;

        context.report({ node, messageId: "bindThis" });
      },
    };
  },
});
