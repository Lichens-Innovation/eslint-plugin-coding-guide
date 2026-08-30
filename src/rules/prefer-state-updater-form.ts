import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

const decapitalize = (name: string): string => name.charAt(0).toLowerCase() + name.slice(1);

interface NonReferencePositionArgs {
  node: TSESTree.Node;
  key: string;
}

/** Skip AST fields that hold a property/method *name* rather than a variable reference. */
const isNonReferencePosition = ({ node, key }: NonReferencePositionArgs): boolean => {
  if ((node.type === "MemberExpression" || node.type === "MethodDefinition") && key === "property" && !node.computed) {
    return true;
  }
  if (node.type === "Property" && key === "key" && !node.computed) return true;
  return false;
};

const isAstNode = (value: unknown): value is TSESTree.Node =>
  !!value && typeof value === "object" && typeof (value as { type?: unknown }).type === "string";

const makeReferencesIdentifier = (name: string): ((node: unknown) => boolean) => {
  const referencesIdentifier = (node: unknown): boolean => {
    if (!isAstNode(node)) return false;
    if (node.type === "Identifier" && node.name === name) return true;

    for (const key of Object.keys(node)) {
      if (key === "parent" || isNonReferencePosition({ node, key })) continue;
      const value = (node as unknown as Record<string, unknown>)[key];
      const matches = Array.isArray(value) ? value.some(referencesIdentifier) : referencesIdentifier(value);
      if (matches) return true;
    }

    return false;
  };

  return referencesIdentifier;
};

export default createRule({
  name: "prefer-state-updater-form",
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer the updater-function form of a state setter when the new value depends on the current one",
    },
    schema: [],
    messages: {
      preferUpdaterForm:
        "'{{setter}}' argument references '{{state}}' directly — use the updater form `{{setter}}((current) => ...)` instead.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== "Identifier" || !/^set[A-Z]/.test(node.callee.name)) return;
        if (node.arguments.length !== 1) return;

        const [arg] = node.arguments;
        if (["ArrowFunctionExpression", "FunctionExpression"].includes(arg.type)) return; // already updater form

        const stateName = decapitalize(node.callee.name.slice("set".length));
        if (!makeReferencesIdentifier(stateName)(arg)) return;

        context.report({
          node,
          messageId: "preferUpdaterForm",
          data: { setter: node.callee.name, state: stateName },
        });
      },
    };
  },
});
