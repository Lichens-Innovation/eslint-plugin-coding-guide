import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";
import { isFunctionNode } from "../utils/ast.utils.js";

interface IsGuardedByTryArgs {
  previous: TSESTree.Node;
  current: TSESTree.Node;
}

const isGuardedByTry = ({ previous, current }: IsGuardedByTryArgs): boolean =>
  current.type === "TryStatement" && (previous === current.block || previous === current.handler);

// Stops at the nearest function boundary: a try inside a callback runs in its own execution context.
const isNestedInTry = (node: TSESTree.TryStatement): boolean => {
  let previous: TSESTree.Node = node;
  let current: TSESTree.Node | undefined = node.parent;

  while (current) {
    if (isFunctionNode(current)) return false;
    if (isGuardedByTry({ previous, current })) return true;

    previous = current;
    current = current.parent;
  }

  return false;
};

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
        if (!isNestedInTry(node)) return;

        context.report({ node, messageId: "nestedTry" });
      },
    };
  },
});
