import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

type OptionalTarget = TSESTree.TSPropertySignature | TSESTree.PropertyDefinition | TSESTree.Identifier;

interface BuildFixArgs {
  node: TSESTree.TSUnionType;
  replacementText: string;
  alreadyOptional: boolean;
}

const isUndefinedKeyword = (typeNode: TSESTree.TypeNode): boolean => typeNode.type === "TSUndefinedKeyword";

const isFunctionParam = (paramNode: TSESTree.Node): boolean => {
  const container = paramNode.parent;
  if (!container || !("params" in container) || !Array.isArray(container.params)) return false;

  return (container.params as TSESTree.Node[]).includes(paramNode);
};

const getParamOptionalTarget = (
  annotated: TSESTree.Identifier | TSESTree.ObjectPattern | TSESTree.ArrayPattern
): TSESTree.Identifier | null => {
  const parent = annotated.parent;
  if (!parent) return null;
  if (parent.type === "AssignmentPattern") return null; // default value already implies optional

  const paramNode = parent.type === "TSParameterProperty" ? parent : annotated;
  if (!isFunctionParam(paramNode) || annotated.type !== "Identifier") return null;

  return annotated;
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

const describeTarget = (target: OptionalTarget): string =>
  ["TSPropertySignature", "PropertyDefinition"].includes(target.type) ? "this property" : "this parameter";

const buildFix =
  ({ node, replacementText, alreadyOptional }: BuildFixArgs): TSESLint.ReportFixFunction =>
  (fixer) => {
    const fixes = [fixer.replaceText(node, replacementText)];
    if (!alreadyOptional && node.parent) fixes.push(fixer.insertTextBefore(node.parent, "?"));
    return fixes;
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
        const fix =
          remaining.length === 1
            ? buildFix({ node, replacementText: sourceCode.getText(remaining[0]), alreadyOptional })
            : null;

        context.report({
          node,
          messageId: alreadyOptional ? "redundantUndefined" : "useOptionalModifier",
          data: { what: describeTarget(target) },
          fix,
        });
      },
    };
  },
});
