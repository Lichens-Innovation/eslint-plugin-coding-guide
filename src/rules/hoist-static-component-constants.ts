import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

import { getChildNodes } from "../ast-utils.js";
import { createRule } from "../create-rule.js";

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

/** True if any identifier referenced inside `node` resolves to a binding local to `functionScope`. */
const referencesLocalBinding = ({ node, functionScope, sourceCode }: ReferencesLocalBindingArgs): boolean => {
  let found = false;

  const visit = (current: TSESTree.Node): void => {
    if (found) return;

    if (current.type === "Identifier") {
      const scope = sourceCode.getScope(current);
      const reference = scope.references.find((ref) => ref.identifier === current);
      const variable = reference?.resolved;
      if (variable && isDescendantScope({ scope: variable.scope, ancestorScope: functionScope })) {
        found = true;
      }
      return;
    }

    for (const child of getChildNodes(current)) visit(child);
  };

  visit(node);
  return found;
};

const isNonEmptyLiteral = (node: LiteralCollection): boolean =>
  (node.type === "ArrayExpression" && node.elements.length > 0) ||
  (node.type === "ObjectExpression" && node.properties.length > 0);

/** Name of the function that owns `scope` — a component (PascalCase) or a hook (use[A-Z]...). */
const getComponentOrHookName = (scope: TSESLint.Scope.Scope): string | undefined => {
  const block = scope.block;
  if (block.type === "FunctionDeclaration" && block.id) return block.id.name;
  if (block.parent?.type === "VariableDeclarator" && block.parent.id.type === "Identifier") {
    return block.parent.id.name;
  }
  return undefined;
};

const isComponentOrHookName = (name?: string): boolean => !!name && (/^[A-Z]/.test(name) || /^use[A-Z]/.test(name));

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

    return {
      VariableDeclarator(node) {
        if (node.id.type !== "Identifier" || !isLiteralCollection(node.init)) return;
        if (!isNonEmptyLiteral(node.init)) return;

        const scope = sourceCode.getScope(node);
        if (scope.type !== "function") return;
        if (!isComponentOrHookName(getComponentOrHookName(scope))) return;

        if (referencesLocalBinding({ node: node.init, functionScope: scope, sourceCode })) return;

        context.report({ node, messageId: "hoist", data: { name: node.id.name } });
      },
    };
  },
});
