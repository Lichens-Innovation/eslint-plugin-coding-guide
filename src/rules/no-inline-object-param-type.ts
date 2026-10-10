import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";
import { type FunctionLike, isFunctionNode } from "../utils/ast.utils.js";
import { isTestFile } from "../utils/file.utils.js";

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

const isCastType = (node: TSESTree.Node): boolean => {
  const parent = node.parent;
  if (parent?.type !== AST_NODE_TYPES.TSAsExpression && parent?.type !== AST_NODE_TYPES.TSTypeAssertion) return false;
  return parent.typeAnnotation === node;
};

const isInCastType = (node: TSESTree.Node): boolean => {
  for (let current: TSESTree.Node | undefined = node; current; current = current.parent) {
    if (isCastType(current)) return true;
  }
  return false;
};

// Type nodes an inline literal can sit in while still belonging to the same annotation.
const TYPE_WRAPPERS = new Set<string>([
  AST_NODE_TYPES.TSArrayType,
  AST_NODE_TYPES.TSIntersectionType,
  AST_NODE_TYPES.TSOptionalType,
  AST_NODE_TYPES.TSRestType,
  AST_NODE_TYPES.TSTupleType,
  AST_NODE_TYPES.TSTypeOperator,
  AST_NODE_TYPES.TSTypeReference,
  AST_NODE_TYPES.TSUnionType,
]);

const VARIABLE_TARGETS = new Set<string>([
  AST_NODE_TYPES.Identifier,
  AST_NODE_TYPES.ObjectPattern,
  AST_NODE_TYPES.ArrayPattern,
]);

const CALL_TYPES = new Set<string>([AST_NODE_TYPES.CallExpression, AST_NODE_TYPES.NewExpression]);

type AnchorMessageId = "extractReturnInterface" | "extractTypeArgInterface" | "extractVariableInterface";

const isTypeWrapper = (node: TSESTree.Node): boolean =>
  TYPE_WRAPPERS.has(node.type) ||
  (node.type === AST_NODE_TYPES.TSTypeParameterInstantiation && node.parent.type === AST_NODE_TYPES.TSTypeReference);

const getTypeAnchor = (node: TSESTree.Node): TSESTree.Node | undefined => {
  let current = node.parent;
  while (current && isTypeWrapper(current)) current = current.parent;
  return current;
};

const isReturnType = (annotation: TSESTree.TSTypeAnnotation): boolean =>
  isFunctionNode(annotation.parent) && annotation.parent.returnType === annotation;

const isVariableType = (annotation: TSESTree.TSTypeAnnotation): boolean => {
  const target = annotation.parent;
  return (
    VARIABLE_TARGETS.has(target.type) &&
    target.parent?.type === AST_NODE_TYPES.VariableDeclarator &&
    target.parent.id === target
  );
};

const getAnchorMessageId = (anchor?: TSESTree.Node): AnchorMessageId | undefined => {
  if (anchor?.type === AST_NODE_TYPES.TSTypeParameterInstantiation && CALL_TYPES.has(anchor.parent.type)) {
    return "extractTypeArgInterface";
  }
  if (anchor?.type !== AST_NODE_TYPES.TSTypeAnnotation) return undefined;
  if (isReturnType(anchor)) return "extractReturnInterface";
  return isVariableType(anchor) ? "extractVariableInterface" : undefined;
};

const getParamTypeAnnotation = (param: TSESTree.Parameter): TSESTree.TypeNode | undefined =>
  "typeAnnotation" in param ? param.typeAnnotation?.typeAnnotation : undefined;

export default createRule({
  name: "no-inline-object-param-type",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow inline object type literals on function parameters, return types, variables, call type arguments and nested in interface/type members",
    },
    schema: [],
    messages: {
      extractInterface: "Inline object type on this parameter — extract a named `interface` above the function.",
      extractNestedInterface:
        "Inline object type nested in a type member — extract a named `interface` and reference it.",
      extractReturnInterface: "Inline object type in a return type — extract a named `interface` and reference it.",
      extractTypeArgInterface:
        "Inline object type as a generic argument — extract a named `interface` and reference it.",
      extractVariableInterface:
        "Inline object type on a variable annotation — extract a named `interface` and reference it.",
    },
  },
  defaultOptions: [],
  create(context) {
    const isTest = isTestFile(context.filename);

    const checkParam = (param: TSESTree.Parameter): void => {
      const typeAnnotation = getParamTypeAnnotation(param);
      if (typeAnnotation?.type === "TSTypeLiteral") {
        context.report({ node: typeAnnotation, messageId: "extractInterface" });
      }
    };

    const checkFunction = (node: FunctionLike): void => {
      node.params.forEach(checkParam);
    };

    // Only the outermost nested literal is reported; extracting it surfaces deeper ones.
    const checkNestedLiteral = (node: TSESTree.TSTypeLiteral): void => {
      if (isTest && isInCastType(node)) return;
      const memberAncestors = countMemberAncestors(node);
      if (memberAncestors === 1) {
        context.report({ node, messageId: "extractNestedInterface" });
        return;
      }
      const messageId = memberAncestors === 0 ? getAnchorMessageId(getTypeAnchor(node)) : undefined;
      if (messageId) context.report({ node, messageId });
    };

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
      TSTypeLiteral: checkNestedLiteral,
    };
  },
});
