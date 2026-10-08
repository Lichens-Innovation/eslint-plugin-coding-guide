import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

type FunctionLike = TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression;

const MEMBER_TYPES = new Set<string>([
  AST_NODE_TYPES.TSPropertySignature,
  AST_NODE_TYPES.TSIndexSignature,
  AST_NODE_TYPES.TSMethodSignature,
]);

const countMemberAncestors = (node: TSESTree.Node): number => {
  let count = 0;
  for (let current = node.parent; current; current = current.parent) {
    if (MEMBER_TYPES.has(current.type)) count += 1;
  }
  return count;
};

export default createRule({
  name: "no-inline-object-param-type",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow inline object type literals on function parameters and nested in interface/type members",
    },
    schema: [],
    messages: {
      extractInterface: "Inline object type on this parameter — extract a named `interface` above the function.",
      extractNestedInterface:
        "Inline object type nested in a type member — extract a named `interface` and reference it.",
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

    // Only the outermost nested literal is reported; extracting it surfaces deeper ones.
    const checkNestedLiteral = (node: TSESTree.TSTypeLiteral): void => {
      if (countMemberAncestors(node) === 1) {
        context.report({ node, messageId: "extractNestedInterface" });
      }
    };

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
      TSTypeLiteral: checkNestedLiteral,
    };
  },
});
