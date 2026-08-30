import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

const isCurriedArrow = (node: TSESTree.Expression): boolean => {
  if (node.type !== "ArrowFunctionExpression") return false;
  if (node.body.type === "ArrowFunctionExpression") return true;
  if (node.body.type !== "BlockStatement") return false;

  return node.body.body.some(
    (statement) => statement.type === "ReturnStatement" && statement.argument?.type === "ArrowFunctionExpression"
  );
};

export default createRule({
  name: "no-inline-curried-handler",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow a curried handler factory declared as a local component variable",
    },
    schema: [],
    messages: {
      extractToUtils:
        "'{{name}}' is a curried handler factory declared inside a component — move it to a *.utils.ts file.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      VariableDeclarator(node) {
        if (!node.init || !isCurriedArrow(node.init)) return;
        if (node.id.type !== "Identifier") return;

        const scope = context.sourceCode.getScope(node);
        if (scope.type !== "function") return; // module-scope factories are fine

        context.report({ node, messageId: "extractToUtils", data: { name: node.id.name } });
      },
    };
  },
});
