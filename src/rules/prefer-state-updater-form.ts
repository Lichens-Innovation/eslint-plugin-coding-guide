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

const getReferenceChildren = (node: TSESTree.Node): unknown[] =>
  Object.entries(node)
    .filter(([key]) => key !== "parent" && !isNonReferencePosition({ node, key }))
    .flatMap(([, value]) => (Array.isArray(value) ? value : [value]));

interface ReferencesIdentifierArgs {
  node: unknown;
  name: string;
}

const referencesIdentifier = ({ node, name }: ReferencesIdentifierArgs): boolean => {
  if (!isAstNode(node)) return false;
  if (node.type === "Identifier" && node.name === name) return true;

  return getReferenceChildren(node).some((child) => referencesIdentifier({ node: child, name }));
};

const isStateSetterCall = (
  node: TSESTree.CallExpression
): node is TSESTree.CallExpression & { callee: TSESTree.Identifier } =>
  node.callee.type === "Identifier" && /^set[A-Z]/.test(node.callee.name);

const isUpdaterFunction = (node: TSESTree.CallExpressionArgument): boolean =>
  ["ArrowFunctionExpression", "FunctionExpression"].includes(node.type);

const toStateName = (setterName: string): string => decapitalize(setterName.slice("set".length));

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
        if (!isStateSetterCall(node) || node.arguments.length !== 1) return;

        const [arg] = node.arguments;
        if (isUpdaterFunction(arg)) return;

        const stateName = toStateName(node.callee.name);
        if (!referencesIdentifier({ node: arg, name: stateName })) return;

        context.report({
          node,
          messageId: "preferUpdaterForm",
          data: { setter: node.callee.name, state: stateName },
        });
      },
    };
  },
});
