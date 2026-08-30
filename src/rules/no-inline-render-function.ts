import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

const RENDER_NAME_RE = /^render[A-Z]/;

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

export default createRule({
  name: "no-inline-render-function",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow calling a locally-declared render* helper function from within JSX",
    },
    schema: [],
    messages: {
      extractSubcomponent:
        "'{{name}}' is a local render helper called from JSX — extract a `<{{suggested}} />` subcomponent instead.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== "Identifier" || !RENDER_NAME_RE.test(node.callee.name)) return;
        if (!isInsideJsx(node)) return;

        const scope = context.sourceCode.getScope(node);
        const variable = scope.references.find((ref) => ref.identifier === node.callee)?.resolved ?? undefined;
        if (!isLocallyDeclaredFunction(variable)) return;

        const name = node.callee.name;
        const suggested = name.slice("render".length) || "Section";

        context.report({ node, messageId: "extractSubcomponent", data: { name, suggested } });
      },
    };
  },
});
