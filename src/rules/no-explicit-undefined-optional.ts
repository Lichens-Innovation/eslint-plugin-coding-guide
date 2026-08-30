import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

const isUndefinedKeyword = (typeNode: TSESTree.TypeNode): boolean => typeNode.type === "TSUndefinedKeyword";

type OptionalTarget = TSESTree.TSPropertySignature | TSESTree.PropertyDefinition | TSESTree.Identifier;

/** Resolve the parameter node that owns `optional`/`?`, walking through a TSParameterProperty wrapper. */
const getParamOptionalTarget = (
  annotated: TSESTree.Identifier | TSESTree.ObjectPattern | TSESTree.ArrayPattern
): TSESTree.Identifier | null => {
  const parent = annotated.parent;
  if (!parent) return null;
  if (parent.type === "AssignmentPattern") return null; // default value already implies optional

  const paramNode = parent.type === "TSParameterProperty" ? parent : annotated;
  const container = paramNode.parent;
  if (
    container &&
    "params" in container &&
    Array.isArray(container.params) &&
    (container.params as TSESTree.Node[]).includes(paramNode) &&
    annotated.type === "Identifier"
  ) {
    return annotated;
  }
  return null;
};

const getOptionalTarget = (unionNode: TSESTree.TSUnionType): OptionalTarget | null => {
  const typeAnnotation = unionNode.parent;
  if (!typeAnnotation || typeAnnotation.type !== "TSTypeAnnotation") return null;

  const annotated = typeAnnotation.parent;
  if (!annotated) return null;

  if (annotated.type === "TSPropertySignature" || annotated.type === "PropertyDefinition") {
    return annotated;
  }
  if (annotated.type === "Identifier" || annotated.type === "ObjectPattern" || annotated.type === "ArrayPattern") {
    return getParamOptionalTarget(annotated);
  }
  return null;
};

export default createRule({
  name: "no-explicit-undefined-optional",
  meta: {
    type: "suggestion",
    docs: {
      description: "Use `?` instead of an explicit `| undefined` on params/properties that support it",
    },
    fixable: "code",
    schema: [],
    messages: {
      useOptionalModifier: "Do not use explicit `| undefined` to mark {{what}} optional — use `?` instead.",
      redundantUndefined: "{{what}} is already optional (`?`) — remove the redundant explicit `undefined`.",
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      TSUnionType(node) {
        const remaining = node.types.filter((typeNode) => !isUndefinedKeyword(typeNode));
        if (remaining.length === node.types.length || remaining.length === 0) return;

        const target = getOptionalTarget(node);
        if (!target) return;

        const alreadyOptional = target.optional === true;
        const what = ["TSPropertySignature", "PropertyDefinition"].includes(target.type)
          ? "this property"
          : "this parameter";

        context.report({
          node,
          messageId: alreadyOptional ? "redundantUndefined" : "useOptionalModifier",
          data: { what },
          fix:
            remaining.length === 1
              ? (fixer) => {
                  const fixes = [fixer.replaceText(node, sourceCode.getText(remaining[0]))];
                  if (!alreadyOptional && node.parent) fixes.push(fixer.insertTextBefore(node.parent, "?"));
                  return fixes;
                }
              : null,
        });
      },
    };
  },
});
