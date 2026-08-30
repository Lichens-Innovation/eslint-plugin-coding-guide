import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

const isJsxElementOrReactElementType = (node: TSESTree.TypeNode): boolean => {
  if (node.type !== "TSTypeReference") return false;
  const typeName = node.typeName;

  if (typeName.type === "TSQualifiedName") {
    return typeName.left.type === "Identifier" && typeName.left.name === "JSX" && typeName.right.name === "Element";
  }

  return typeName.type === "Identifier" && ["ReactElement", "JSX.Element"].includes(typeName.name);
};

const isNullOrUndefinedKeyword = (node: TSESTree.TypeNode): boolean =>
  ["TSNullKeyword", "TSUndefinedKeyword"].includes(node.type);

const hasReactNodeImported = (program: TSESTree.Program): boolean =>
  program.body.some(
    (statement) =>
      statement.type === "ImportDeclaration" &&
      statement.source.value === "react" &&
      statement.specifiers.some(
        (specifier) =>
          specifier.type === "ImportSpecifier" &&
          specifier.imported.type === "Identifier" &&
          specifier.imported.name === "ReactNode"
      )
  );

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
        const hasElementType = node.types.some(isJsxElementOrReactElementType);
        const hasNullish = node.types.some(isNullOrUndefinedKeyword);
        if (!hasElementType || !hasNullish) return;

        const canAutofix = hasReactNodeImported(context.sourceCode.ast);

        context.report({
          node,
          messageId: "preferReactNode",
          fix: canAutofix ? (fixer) => fixer.replaceText(node, "ReactNode") : undefined,
        });
      },
    };
  },
});
