import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

const isJsonParseCall = (node: TSESTree.CallExpression): boolean =>
  node.callee.type === "MemberExpression" &&
  node.callee.object.type === "Identifier" &&
  node.callee.object.name === "JSON" &&
  node.callee.property.type === "Identifier" &&
  node.callee.property.name === "parse";

/** Walk up from `node`, stopping at the first TryStatement/function boundary encountered. */
const isInsideTryBlock = (node: TSESTree.Node): boolean => {
  let current: TSESTree.Node | undefined = node;
  let previous: TSESTree.Node | undefined;

  while (current) {
    if (current.type === "TryStatement" && previous === current.block) return true;
    if (["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(current.type)) {
      return false;
    }

    previous = current;
    current = current.parent;
  }

  return false;
};

export default createRule({
  name: "no-unguarded-json-parse",
  meta: {
    type: "suggestion",
    docs: {
      description: "Require JSON.parse(...) to be wrapped in a try/catch",
    },
    schema: [],
    messages: {
      unguarded: "JSON.parse(...) can throw on malformed input — wrap it in a try/catch.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (!isJsonParseCall(node)) return;
        if (isInsideTryBlock(node)) return;

        context.report({ node, messageId: "unguarded" });
      },
    };
  },
});
