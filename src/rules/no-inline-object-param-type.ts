import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

type FunctionLike = TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression;

export default createRule({
  name: "no-inline-object-param-type",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow inline object type literals on function parameters",
    },
    schema: [],
    messages: {
      extractInterface: "Inline object type on this parameter — extract a named `interface` above the function.",
    },
  },
  defaultOptions: [],
  create(context) {
    const checkParam = (param: TSESTree.Parameter): void => {
      const typeAnnotation = "typeAnnotation" in param ? param.typeAnnotation?.typeAnnotation : undefined;
      if (typeAnnotation?.type === "TSTypeLiteral") {
        context.report({ node: typeAnnotation, messageId: "extractInterface" });
      }
    };

    const checkFunction = (node: FunctionLike): void => {
      node.params.forEach(checkParam);
    };

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
    };
  },
});
