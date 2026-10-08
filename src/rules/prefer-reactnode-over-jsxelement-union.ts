import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";
import { hasNamedImport } from "../utils/ast.utils.js";

const isJsxElementQualifiedName = (typeName: TSESTree.TSQualifiedName): boolean =>
  typeName.left.type === "Identifier" && typeName.left.name === "JSX" && typeName.right.name === "Element";

const isJsxElementOrReactElementType = (node: TSESTree.TypeNode): boolean => {
  if (node.type !== "TSTypeReference") return false;
  const typeName = node.typeName;

  if (typeName.type === "TSQualifiedName") {
    return isJsxElementQualifiedName(typeName);
  }

  return typeName.type === "Identifier" && ["ReactElement", "JSX.Element"].includes(typeName.name);
};

const isNullOrUndefinedKeyword = (node: TSESTree.TypeNode): boolean =>
  ["TSNullKeyword", "TSUndefinedKeyword"].includes(node.type);

const isNullableElementUnion = (node: TSESTree.TSUnionType): boolean =>
  node.types.some(isJsxElementOrReactElementType) && node.types.some(isNullOrUndefinedKeyword);

export default createRule({
  name: "prefer-reactnode-over-jsxelement-union",
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer ReactNode over a JSX.Element | null | undefined union",
    },
    fixable: "code",
    schema: [],
    messages: {
      preferReactNode: "Use `ReactNode` instead of a `JSX.Element`/`ReactElement` union with null/undefined.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      TSUnionType(node) {
        if (!isNullableElementUnion(node)) return;

        const canAutofix = hasNamedImport({ program: context.sourceCode.ast, source: "react", name: "ReactNode" });

        context.report({
          node,
          messageId: "preferReactNode",
          fix: canAutofix ? (fixer) => fixer.replaceText(node, "ReactNode") : undefined,
        });
      },
    };
  },
});
