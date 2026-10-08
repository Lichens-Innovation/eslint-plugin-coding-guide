import { isNotBlank } from "@lichens-innovation/ts-common";
import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";
import { getChildNodes } from "../utils/ast.utils.js";
import { isHookName } from "../utils/react.utils.js";

type LiteralCollection = TSESTree.ArrayExpression | TSESTree.ObjectExpression;

const isLiteralCollection = (node?: TSESTree.Node | null): node is LiteralCollection =>
  node?.type === "ArrayExpression" || node?.type === "ObjectExpression";

interface IsDescendantScopeArgs {
  scope: TSESLint.Scope.Scope;
  ancestorScope: TSESLint.Scope.Scope;
}

const isDescendantScope = ({ scope, ancestorScope }: IsDescendantScopeArgs): boolean => {
  let current: TSESLint.Scope.Scope | null = scope;
  while (current) {
    if (current === ancestorScope) return true;
    current = current.upper;
  }
  return false;
};

interface ReferencesLocalBindingArgs {
  node: TSESTree.Node;
  functionScope: TSESLint.Scope.Scope;
  sourceCode: Readonly<TSESLint.SourceCode>;
}

interface ResolvesToLocalBindingArgs {
  identifier: TSESTree.Identifier;
  functionScope: TSESLint.Scope.Scope;
  sourceCode: Readonly<TSESLint.SourceCode>;
}

const resolvesToLocalBinding = ({ identifier, functionScope, sourceCode }: ResolvesToLocalBindingArgs): boolean => {
  const scope = sourceCode.getScope(identifier);
  const reference = scope.references.find((ref) => ref.identifier === identifier);
  const variable = reference?.resolved;

  return !!variable && isDescendantScope({ scope: variable.scope, ancestorScope: functionScope });
};

const referencesLocalBinding = ({ node, functionScope, sourceCode }: ReferencesLocalBindingArgs): boolean => {
  if (node.type === "Identifier") return resolvesToLocalBinding({ identifier: node, functionScope, sourceCode });

  return getChildNodes(node).some((child) => referencesLocalBinding({ node: child, functionScope, sourceCode }));
};

const isNonEmptyLiteral = (node: LiteralCollection): boolean =>
  (node.type === "ArrayExpression" && node.elements.length > 0) ||
  (node.type === "ObjectExpression" && node.properties.length > 0);

const getComponentOrHookName = (scope: TSESLint.Scope.Scope): string | undefined => {
  const block = scope.block;
  if (block.type === "FunctionDeclaration" && block.id) return block.id.name;
  if (block.parent?.type === "VariableDeclarator" && block.parent.id.type === "Identifier") {
    return block.parent.id.name;
  }
  return undefined;
};

const isComponentOrHookName = (name?: string): boolean => isNotBlank(name) && (/^[A-Z]/.test(name) || isHookName(name));

export default createRule({
  name: "hoist-static-component-constants",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow a static array/object literal declared inside a component body",
    },
    schema: [],
    messages: {
      hoist: "'{{name}}' has no dependency on this component's scope — hoist it to module scope.",
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    const isComponentOrHookScope = (scope: TSESLint.Scope.Scope): boolean =>
      scope.type === "function" && isComponentOrHookName(getComponentOrHookName(scope));

    return {
      VariableDeclarator(node) {
        if (node.id.type !== "Identifier" || !isLiteralCollection(node.init)) return;
        if (!isNonEmptyLiteral(node.init)) return;

        const scope = sourceCode.getScope(node);
        if (!isComponentOrHookScope(scope)) return;
        if (referencesLocalBinding({ node: node.init, functionScope: scope, sourceCode })) return;

        context.report({ node, messageId: "hoist", data: { name: node.id.name } });
      },
    };
  },
});
