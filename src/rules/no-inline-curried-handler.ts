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
      description: "Disallow a curried handler factory declared as a local variable inside a function",
    },
    schema: [],
    messages: {
      noCurriedHandler:
        "'{{name}}' is a curried handler factory declared inside a function — write the handler inline at the call site (`() => fn(id)`) or extract a child component that owns it; move it to a *.utils.ts file only if it uses no state, props or hooks.",
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

        context.report({ node, messageId: "noCurriedHandler", data: { name: node.id.name } });
      },
    };
  },
});
