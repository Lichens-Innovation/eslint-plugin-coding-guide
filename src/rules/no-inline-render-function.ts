import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

import { functionReturnsJsx } from "../ast-utils.js";
import { createRule } from "../create-rule.js";

const RENDER_NAME_RE = /^render[A-Z]/;

type FunctionLike = TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression | TSESTree.FunctionDeclaration;

/** True for a locally-declared function/const, false for a parameter (e.g. a render-prop passed in). */
const isLocallyDeclaredFunction = (variable?: TSESLint.Scope.Variable): boolean => {
  if (variable?.scope.type !== "function") return false;
  const def = variable.defs[0] as { type?: string } | undefined;
  return def?.type === "FunctionName" || def?.type === "Variable";
};

const isInsideJsx = (node: TSESTree.Node): boolean => {
  let current: TSESTree.Node | undefined = node.parent;
  while (current) {
    if (current.type === "JSXExpressionContainer") return true;
    current = current.parent;
  }
  return false;
};

/** True when this Identifier is the callee of a CallExpression (handled separately). */
const isCallCallee = (node: TSESTree.Identifier): boolean =>
  node.parent.type === "CallExpression" && node.parent.callee === node;

const suggestedName = (name: string): string => name.slice("render".length) || "Section";

export default createRule({
  name: "no-inline-render-function",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow locally-declared render* helpers that return JSX, and using them from JSX (call or reference)",
    },
    schema: [],
    messages: {
      extractSubcomponent:
        "'{{name}}' is a local render helper called from JSX — extract a `<{{suggested}} />` subcomponent instead.",
    },
  },
  defaultOptions: [],
  create(context) {
    /** Variables already reported at their declaration site — avoid duplicate use-site reports. */
    const reportedVariables = new WeakSet<object>();

    const resolveVariable = (identifier: TSESTree.Identifier): TSESLint.Scope.Variable | undefined => {
      const scope = context.sourceCode.getScope(identifier);
      return scope.references.find((ref) => ref.identifier === identifier)?.resolved ?? undefined;
    };

    const report = (node: TSESTree.Node, name: string, variable?: TSESLint.Scope.Variable): void => {
      if (variable) {
        if (reportedVariables.has(variable)) return;
        reportedVariables.add(variable);
      }

      context.report({
        node,
        messageId: "extractSubcomponent",
        data: { name, suggested: suggestedName(name) },
      });
    };

    const reportLocalRenderInJsx = (identifier: TSESTree.Identifier): void => {
      if (!RENDER_NAME_RE.test(identifier.name)) return;
      if (!isInsideJsx(identifier)) return;

      const variable = resolveVariable(identifier);
      if (!isLocallyDeclaredFunction(variable)) return;

      report(identifier, identifier.name, variable);
    };

    const isNestedInFunctionScope = (node: FunctionLike): boolean => {
      // Arrow/FunctionExpression create their own function scope — check the binding's
      // enclosing scope (VariableDeclarator) instead of the function body scope.
      if (node.type === "FunctionDeclaration") {
        return context.sourceCode.getScope(node).upper?.type === "function";
      }
      if (node.parent.type === "VariableDeclarator") {
        return context.sourceCode.getScope(node.parent).type === "function";
      }
      return false;
    };

    const resolveDeclarationVariable = (node: FunctionLike, name: string): TSESLint.Scope.Variable | undefined => {
      if (node.type === "FunctionDeclaration") {
        return context.sourceCode.getScope(node).upper?.set.get(name);
      }
      if (node.parent.type === "VariableDeclarator") {
        return context.sourceCode.getScope(node.parent).set.get(name);
      }
      return undefined;
    };

    const checkRenderFunction = (node: FunctionLike, name: string | undefined): void => {
      if (!name || !RENDER_NAME_RE.test(name)) return;
      if (!functionReturnsJsx(node)) return;
      if (!isNestedInFunctionScope(node)) return;

      report(node, name, resolveDeclarationVariable(node, name));
    };

    return {
      VariableDeclarator(node) {
        if (node.id.type !== "Identifier") return;
        if (!node.init || (node.init.type !== "ArrowFunctionExpression" && node.init.type !== "FunctionExpression")) {
          return;
        }

        checkRenderFunction(node.init, node.id.name);
      },

      FunctionDeclaration(node) {
        checkRenderFunction(node, node.id?.name);
      },

      CallExpression(node) {
        if (node.callee.type !== "Identifier") return;
        reportLocalRenderInJsx(node.callee);
      },

      Identifier(node) {
        if (isCallCallee(node)) return;
        // Skip the binding identifier itself (declaration sites handled above).
        if (node.parent.type === "VariableDeclarator" && node.parent.id === node) return;
        if (node.parent.type === "FunctionDeclaration" && node.parent.id === node) return;

        reportLocalRenderInJsx(node);
      },
    };
  },
});
