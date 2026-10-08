import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";
import { unwrapTypeExpression } from "../utils/ast.utils.js";

export default createRule({
  name: "no-inline-await-access",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow operating directly on an awaited value, as in `(await promise).property`",
    },
    schema: [],
    messages: {
      inlineAwait:
        "Avoid operating on `(await …)` inline — assign the awaited value to a variable first, then use it on the next line.",
    },
  },
  defaultOptions: [],
  create(context) {
    const reportInlineAwait = (target: TSESTree.Node): void => {
      const unwrapped = unwrapTypeExpression(target);
      if (unwrapped.type !== "AwaitExpression") return;

      context.report({ node: unwrapped, messageId: "inlineAwait" });
    };

    return {
      MemberExpression(node) {
        reportInlineAwait(node.object);
      },
      CallExpression(node) {
        reportInlineAwait(node.callee);
      },
    };
  },
});
