import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

export default createRule({
  name: "no-nested-try",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow nesting a try statement inside another try block or catch handler",
    },
    schema: [],
    messages: {
      nestedTry: "Nested try/catch — flatten into a single try/catch that handles both error paths.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      TryStatement(node) {
        let previous: TSESTree.Node = node;
        let current: TSESTree.Node | undefined = node.parent;

        while (current) {
          if (["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(current.type)) {
            return;
          }

          if (current.type === "TryStatement" && (previous === current.block || previous === current.handler)) {
            context.report({ node, messageId: "nestedTry" });
            return;
          }

          previous = current;
          current = current.parent;
        }
      },
    };
  },
});
