import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

/** Strip type-only wrappers so `((await x) as T).y` and `(await x)!.y` are seen as `(await x).y`. */
const unwrapTypeExpression = (node: TSESTree.Node): TSESTree.Node => {
  let current = node;

  while (
    current.type === "TSAsExpression" ||
    current.type === "TSNonNullExpression" ||
    current.type === "TSSatisfiesExpression" ||
    current.type === "TSTypeAssertion"
  ) {
    current = current.expression;
  }

  return current;
};

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
    const check = (target: TSESTree.Node): void => {
      const unwrapped = unwrapTypeExpression(target);
      if (unwrapped.type !== "AwaitExpression") return;

      context.report({ node: unwrapped, messageId: "inlineAwait" });
    };

    return {
      MemberExpression(node) {
        check(node.object);
      },
      CallExpression(node) {
        check(node.callee);
      },
    };
  },
});
